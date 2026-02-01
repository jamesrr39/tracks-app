package main

import (
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/swaggest/openapi-go/openapi3"
	"github.com/swaggest/rest"
	"github.com/swaggest/rest/chirouter"
	"github.com/swaggest/rest/jsonschema"
	"github.com/swaggest/rest/nethttp"
	"github.com/swaggest/rest/openapi"
	"github.com/swaggest/rest/request"
	"github.com/swaggest/rest/response"
	"github.com/swaggest/rest/response/gzip"
	"github.com/swaggest/swgui/v3cdn"

	"github.com/jamesrr39/go-errorsx"
	"github.com/jamesrr39/go-openapix"
	"github.com/jamesrr39/goutil/userextra"
	"github.com/jamesrr39/tracks-app/server/dal"
	"github.com/jamesrr39/tracks-app/server/diskcache"
	"github.com/jamesrr39/tracks-app/server/domain"
	"github.com/jamesrr39/tracks-app/server/externalservices/overpass"
	"github.com/jamesrr39/tracks-app/server/httphandlers"

	"gopkg.in/alecthomas/kingpin.v2"
)

var (
	AppVersion = "dev"
	app        *kingpin.Application
)

func main() {
	app = kingpin.New("api server", "")
	setupServe()
	setupGenerateOpenapiSpec()
	kingpin.MustParse(app.Parse(os.Args[1:]))
}

const (
	SpecFormatYAML       = "yaml"
	SpecFormatJSON       = "json"
	SpecFormatJSONPretty = "jsonpretty"
)

const (
	onlinePMTilesUrl = "https://demo-bucket.protomaps.com/v4.pmtiles"
)

func setupGenerateOpenapiSpec() {
	cmd := app.Command("generate-openapi-spec", "")
	format := cmd.Flag("format", "output format").Short('F').Default(SpecFormatYAML).Enum(SpecFormatYAML, SpecFormatJSON, SpecFormatJSONPretty)
	outputFilePath := cmd.Flag("output", "").Short('O').Default(os.Stdout.Name()).String()
	cmd.Action(func(pc *kingpin.ParseContext) error {
		apiSchema, _ := createAPIRouter(&dal.FitDAL{}, &dal.CustomMapsDAL{}, "")
		spec := apiSchema.Reflector().Spec

		specMarshalFuncMap := map[string]func() ([]byte, error){
			SpecFormatYAML: spec.MarshalYAML,
			SpecFormatJSON: spec.MarshalJSON,
			SpecFormatJSONPretty: func() ([]byte, error) {
				return json.MarshalIndent(spec, "", "\t")
			},
		}

		specMarshalFunc, ok := specMarshalFuncMap[*format]
		if !ok {
			return errorsx.Errorf("unknown format type: %q", *format)
		}

		specBytes, err := specMarshalFunc()
		if err != nil {
			return errorsx.ErrWithStack(errorsx.Wrap(err))
		}

		err = os.WriteFile(*outputFilePath, specBytes, 0644)
		if err != nil {
			return errorsx.ErrWithStack(errorsx.Wrap(err))
		}

		return nil
	})
}

func setupServe() {
	cmd := app.Command("serve", "")
	rootDir := cmd.Arg("rootDir", "directory that all tracks can be found under").Required().String()
	customMapsBasePath := cmd.Flag("custom-maps-dir", "directory that custom maps can be found under").Default("").String()
	unexpandedCachesDir := cmd.Flag("caches-dir", "directory to store the caches in").Default("~/.cache/github.com/jamesrr39/tracks-app").String()
	addr := cmd.Flag("addr", "address and port to serve on. ':8090' = to everyone on port 8090. 'localhost:8090' = to only localhost on 8090").Default("localhost:8090").String()
	overpassApiBaseURL := cmd.Flag("overpass-api-base-url", "Supply a URL for your own instance of the Overpass API server, if you prefer to use your own.").Default(overpass.DefaultOverpassAPIBaseURL).String()
	pmtilesMapFilePath := cmd.Flag("pmtiles-file-path", "").String()

	cmd.Action(func(pc *kingpin.ParseContext) error {

		cachesDir, err := userextra.ExpandUser(*unexpandedCachesDir)
		if err != nil {
			return errorsx.ErrWithStack(errorsx.Wrap(err))
		}

		err = os.MkdirAll(cachesDir, 0700)
		if err != nil {
			return errorsx.ErrWithStack(errorsx.Wrap(err))
		}

		cacheDBPath := filepath.Join(cachesDir, "tracks-cache-bolt.db")
		cacheDBConn, err := diskcache.NewConn(cacheDBPath)
		if err != nil {
			return errorsx.ErrWithStack(errorsx.Wrap(err))
		}

		fitDAL, err := dal.NewFitDALAndScan(*rootDir, cachesDir, overpass.NewOverpassNearbyCityDataFetcher(time.Second*10, 2, cacheDBConn, *overpassApiBaseURL))
		if err != nil {
			return errorsx.ErrWithStack(errorsx.Wrap(err, "root directory", *rootDir))
		}

		customMapsDAL := &dal.CustomMapsDAL{Maps: []domain.CustomMapMetadata{}}
		if *customMapsBasePath != "" {
			customMapsDAL, err = dal.NewCustomMapsDALAndScan(*customMapsBasePath)
			if err != nil {
				return errorsx.ErrWithStack(errorsx.Wrap(err, "customMapsBasePath", *customMapsBasePath))
			}
		}

		r, _ := createRouter(fitDAL, customMapsDAL, *pmtilesMapFilePath)

		r.Mount("/", httphandlers.NewClientHandler())

		slog.Info("attempting to broadcast", "address", "http://"+*addr)

		server := &http.Server{
			Addr:           *addr,
			Handler:        r,
			ReadTimeout:    10 * time.Second,
			WriteTimeout:   10 * time.Second,
			MaxHeaderBytes: 1 << 20,
		}

		err = server.ListenAndServe()
		if err != nil {
			return errorsx.ErrWithStack(errorsx.Wrap(err))
		}

		return nil
	})
}

const ApiRouterBaseURL = "/api"

func createAPIRouter(fitDAL *dal.FitDAL, customMapsDAL *dal.CustomMapsDAL, pmtilesFilePath string) (*openapi.Collector, *chirouter.Wrapper) {
	apiSchema := &openapi.Collector{}
	apiSchema.Reflector().SpecEns().Info.Title = "Tracks"
	apiSchema.Reflector().SpecEns().Info.WithDescription("REST API definitions for Tracks App")

	serverDesc := "API server"

	apiSchema.Reflector().SpecEns().Info.Version = AppVersion
	apiSchema.Reflector().Spec.Servers = append(apiSchema.Reflector().Spec.Servers, openapi3.Server{
		URL:         "/api",
		Description: &serverDesc,
	})

	// Setup request decoder and validator.
	validatorFactory := jsonschema.NewFactory(apiSchema, apiSchema)
	decoderFactory := request.NewDecoderFactory()
	decoderFactory.ApplyDefaults = true
	decoderFactory.SetDecoderFunc(rest.ParamInPath, chirouter.PathToURLValues)

	apiRouter := chirouter.NewWrapper(chi.NewRouter())
	apiRouter.Use(
		nethttp.OpenAPIMiddleware(apiSchema),          // Documentation collector.
		request.DecoderMiddleware(decoderFactory),     // Request decoder setup.
		request.ValidatorMiddleware(validatorFactory), // Request validator setup.
		response.EncoderMiddleware,                    // Response encoder setup.
	)

	apiRouter.Route("/v1", func(r chi.Router) {
		openapix.Get(r, "/info", httphandlers.BuildGetInfo(pmtilesFilePath))
		openapix.Get(r, "/tracks", httphandlers.BuildGetAllSummaries(fitDAL))
		openapix.Get(r, "/tracks/{path}", httphandlers.BuildGetTrackSummary(fitDAL))
		openapix.Get(r, "/tracks/{path}/records", httphandlers.BuildGetTrackRecords(fitDAL))
		openapix.Get(r, "/tracks/{path}/parsed/gpx", httphandlers.BuildGetParsedGpxFile(fitDAL))
		openapix.Get(r, "/tracks/{path}/parsed/fit", httphandlers.BuildGetParsedFitFile(fitDAL))
		openapix.Get(r, "/tracks/{path}/raw", httphandlers.BuildGetRawFile(fitDAL))
		openapix.Get(r, "/custom-maps", httphandlers.BuildGetCustomMaps(customMapsDAL))
	})

	openapix.MustCheckNonNullArrays(apiSchema.Reflector().Spec.Components.Schemas.MapOfSchemaOrRefValues)
	openapix.MustNotHaveDuplicateOperationIDOrUnknownSecurity(apiSchema.Reflector().Spec)

	return apiSchema, apiRouter
}

func mustCheckFileExists(pmtilesMapFilePath string) {
	_, err := os.Stat(pmtilesMapFilePath)
	if err != nil {
		panic(fmt.Sprintf("Error 'stat'ing PM tiles file path (%s). Error: %s", pmtilesMapFilePath, err))
	}
}

func createRouter(fitDAL *dal.FitDAL, customMapsDAL *dal.CustomMapsDAL, pmtilesMapFilePath string) (*chirouter.Wrapper, *openapi.Collector) {

	if pmtilesMapFilePath != "" {
		mustCheckFileExists(pmtilesMapFilePath)
	}

	apiSchema, apiRouter := createAPIRouter(fitDAL, customMapsDAL, pmtilesMapFilePath)

	rootRouter := chirouter.NewWrapper(chi.NewRouter())

	rootRouter.Use(
		middleware.Recoverer, // Panic recovery.
		gzip.Middleware,      // Response compression with support for direct gzip pass through.
		middleware.DefaultLogger,
	)

	rootRouter.Route("/docs", func(r chi.Router) {
		r.Use(cspHeaderMiddleware)
		r.Method(http.MethodGet, "/openapi.json", apiSchema)
		r.Mount("/", v3cdn.NewHandler(
			apiSchema.Reflector().Spec.Info.Title,
			"/docs/openapi.json",
			"/docs"),
		)
	})

	rootRouter.Mount("/api", apiRouter)

	rootRouter.Route("/map", func(r chi.Router) {
		r.Handle("/pmtiles-basemap-assets/fonts/*", http.StripPrefix("/map/pmtiles-basemap-assets/fonts/", httphandlers.BuildGetPMTilesBasemapAssets()))
		r.Get("/pmtiles", httphandlers.BuildGetPMTilesMapData(pmtilesMapFilePath))
		r.Get("/custom-map/{encodedName}", httphandlers.BuildGetCustomMap(customMapsDAL))
	})

	return rootRouter, apiSchema
}

func cspHeaderMiddleware(next http.Handler) http.Handler {
	csp := strings.Join([]string{
		"default-src: 'self'",
		// "font-src: 'fonts.googleapis.com'",
		"frame-src: 'none'",
	}, "; ")

	fn := func(w http.ResponseWriter, r *http.Request) {

		w.Header().Set("Content-Security-Policy", csp)
		next.ServeHTTP(w, r)

	}

	return http.HandlerFunc(fn)

}
