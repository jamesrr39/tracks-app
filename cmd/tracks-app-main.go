package main

import (
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	// "github.com/go-chi/chi"
	"github.com/go-chi/chi/middleware"
	"github.com/go-chi/chi/v5"
	"github.com/swaggest/rest"
	"github.com/swaggest/rest/chirouter"
	"github.com/swaggest/rest/jsonschema"
	"github.com/swaggest/rest/nethttp"
	"github.com/swaggest/rest/openapi"
	"github.com/swaggest/rest/request"
	"github.com/swaggest/rest/response"
	"github.com/swaggest/rest/response/gzip"
	"github.com/swaggest/swgui/v3cdn"

	"github.com/jamesrr39/go-openapix"
	"github.com/jamesrr39/goutil/userextra"
	"github.com/jamesrr39/tracks-app/server/dal"
	"github.com/jamesrr39/tracks-app/server/diskcache"
	"github.com/jamesrr39/tracks-app/server/externalservices/overpass"
	"github.com/jamesrr39/tracks-app/server/httphandlers"

	"gopkg.in/alecthomas/kingpin.v2"
)

var AppVersion = "dev"

func main() {
	rootDir := kingpin.Arg("rootDir", "directory that all tracks can be found under").Required().String()
	unexpandedCachesDir := kingpin.Flag("caches-dir", "directory to store the caches in").Default("~/.cache/github.com/jamesrr39/tracks-app").String()
	addr := kingpin.Flag("addr", "address and port to serve on. ':8090' = to everyone on port 8090. 'localhost:8090' = to only localhost on 8090").Default("localhost:8090").String()

	kingpin.Parse()

	cachesDir, err := userextra.ExpandUser(*unexpandedCachesDir)
	if nil != err {
		log.Fatalln(err)
	}

	err = os.MkdirAll(cachesDir, 0700)
	if nil != err {
		log.Fatalln(err)
	}

	cacheDBPath := filepath.Join(cachesDir, "tracks-cache-bolt.db")
	cacheDBConn, err := diskcache.NewConn(cacheDBPath)
	if nil != err {
		log.Fatalln(err)
	}

	fitDAL, err := dal.NewFitDALAndScan(*rootDir, cachesDir, overpass.NewOverpassNearbyCityDataFetcher(time.Second*10, 2, cacheDBConn))
	if nil != err {
		log.Fatalf("failed to create a new dal and scan the files under %s. Error: %s\n", *rootDir, err)
	}

	// serverHandler := mux.NewRouter()
	// serverHandler.PathPrefix("/api/").Handler(http.StripPrefix("/api", httphandlers.NewApiHandler(fitDAL)))
	// serverHandler.PathPrefix("/").Handler(http.StripPrefix("/", httphandlers.NewClientHandler()))

	apiSchema := &openapi.Collector{}
	apiSchema.Reflector().SpecEns().Info.Title = "Tracks"
	apiSchema.Reflector().SpecEns().Info.WithDescription("REST API definitions for Tracks App")
	apiSchema.Reflector().SpecEns().Info.Version = AppVersion

	// Setup request decoder and validator.
	validatorFactory := jsonschema.NewFactory(apiSchema, apiSchema)
	decoderFactory := request.NewDecoderFactory()
	decoderFactory.ApplyDefaults = true
	decoderFactory.SetDecoderFunc(rest.ParamInPath, chirouter.PathToURLValues)

	r := chirouter.NewWrapper(chi.NewRouter())

	r.Use(
		middleware.Recoverer,                          // Panic recovery.
		nethttp.OpenAPIMiddleware(apiSchema),          // Documentation collector.
		request.DecoderMiddleware(decoderFactory),     // Request decoder setup.
		request.ValidatorMiddleware(validatorFactory), // Request validator setup.
		response.EncoderMiddleware,                    // Response encoder setup.
		gzip.Middleware,                               // Response compression with support for direct gzip pass through.
		middleware.DefaultLogger,
	)

	r.Route("/docs", func(r chi.Router) {
		r.Use(cspHeaderMiddleware)
		r.Method(http.MethodGet, "/openapi.json", apiSchema)
		r.Mount("/", v3cdn.NewHandler(
			apiSchema.Reflector().Spec.Info.Title,
			"/docs/openapi.json",
			"/docs"),
		)
	})

	// r. httphandlers.NewApiHandler(fitDAL)))
	// serverHandler.PathPrefix("/").Handler(http.StripPrefix("/", httphandlers.NewClientHandler()))

	r.Route("/api/v1", func(r chi.Router) {
		openapix.Get(r, "/tracks", httphandlers.BuildGetAllSummaries(fitDAL))
		openapix.Get(r, "/tracks/{path}", httphandlers.BuildGetTrackSummary(fitDAL))
		openapix.Get(r, "/tracks/{path}/records", httphandlers.BuildGetTrackRecords(fitDAL))

	})

	log.Printf("attempting to broadcast on '%s'\n", *addr)

	server := &http.Server{
		Addr:           *addr,
		Handler:        r,
		ReadTimeout:    10 * time.Second,
		WriteTimeout:   10 * time.Second,
		MaxHeaderBytes: 1 << 20,
	}

	err = server.ListenAndServe()
	if nil != err {
		panic(err)
	}
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
