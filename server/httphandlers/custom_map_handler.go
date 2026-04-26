package httphandlers

import (
	"context"
	"image"
	"image/color"
	_ "image/gif"
	_ "image/jpeg"
	_ "image/png"
	"net/http"
	"net/url"
	"os"

	"github.com/disintegration/imaging"
	"github.com/go-chi/chi/v5"
	"github.com/jamesrr39/go-errorsx"
	openapix "github.com/jamesrr39/go-openapix"
	"github.com/jamesrr39/goutil/dirtraversal"
	"github.com/jamesrr39/tracks-app/server/dal"
	"github.com/jamesrr39/tracks-app/server/domain"
	"github.com/jamesrr39/tracks-app/server/pkg/slogger"
	"github.com/swaggest/rest/nethttp"
)

type mapSourceType struct {
	Name string `json:"name" required:"true"`
	URL  string `json:"url" required:"true"`
}

type GetCustomMapsResponse struct {
	PMTiles     []mapSourceType `json:"pmTiles" nullable:"false" required:"true"`
	OpenFreeMap []mapSourceType `json:"openFreeMap" nullable:"false" required:"true"`
	CustomMaps  []CustomMap     `json:"customMaps" nullable:"false" required:"true"`
}

type CustomMap struct {
	domain.CustomMapMetadata
}

func BuildGetMaps(customMapsDAL *dal.CustomMapsDAL, pmtilesUrl string) *nethttp.Handler {
	return openapix.MustCreateOpenapiEndpoint(
		"Get maps",
		&openapix.HandlerOptions{},
		func(ctx context.Context, input *EmptyStruct, output *GetCustomMapsResponse) error {
			output.CustomMaps = []CustomMap{}
			for _, customMap := range customMapsDAL.Maps {
				m := CustomMap{
					CustomMapMetadata: domain.CustomMapMetadata{
						Name:               customMap.Name,
						CalculatedMetadata: customMap.CalculatedMetadata,
						ReferencePoints:    customMap.ReferencePoints,
					},
				}

				output.CustomMaps = append(output.CustomMaps, m)
			}

			output.OpenFreeMap = append(output.OpenFreeMap, []mapSourceType{
				{Name: "OpenFreeMap - Positron", URL: "https://tiles.openfreemap.org/styles/positron"},
				{Name: "OpenFreeMap - Bright", URL: "https://tiles.openfreemap.org/styles/bright"},
				{Name: "OpenFreeMap - Liberty", URL: "https://tiles.openfreemap.org/styles/liberty"},
			}...)

			output.PMTiles = []mapSourceType{}

			if pmtilesUrl != "" {
				output.PMTiles = append(output.PMTiles, mapSourceType{
					Name: "Promomaps", URL: pmtilesUrl,
				})
			}

			return nil
		},
	)
}

type BuildGetCustomMapsDirectoryListingResponse struct {
	Files []dal.DirectoryListingItem `json:"files" required:"true" nullable:"false"`
}

func BuildGetCustomMapsDirectoryListing(customMapsDAL *dal.CustomMapsDAL) *nethttp.Handler {
	return openapix.MustCreateOpenapiEndpoint(
		"Get custom maps directory listing",
		&openapix.HandlerOptions{},
		func(ctx context.Context, input *EmptyStruct, output *BuildGetCustomMapsDirectoryListingResponse) error {

			files, err := customMapsDAL.GetDirectoryListing()
			if err != nil {
				return errorsx.Wrap(err)
			}

			output.Files = files
			return nil
		})
}

func BuildGetCustomMap(customMapsDAL *dal.CustomMapsDAL) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		decodedName, err := url.PathUnescape(chi.URLParam(r, "encodedName"))
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		if dirtraversal.IsTryingToTraverseUp(decodedName) {
			errorsx.HTTPJSONError(w, slogger.Slogger, errorsx.Errorf("attempting to traverse up"), http.StatusForbidden)
			return
		}

		metadata, err := customMapsDAL.GetByName(decodedName)
		if err != nil {
			http.Error(w, err.Error(), http.StatusNotFound)
			return
		}

		file, err := customMapsDAL.GetFile(decodedName)
		if err != nil {
			if os.IsNotExist(err) {
				http.Error(w, err.Error(), http.StatusNotFound)
				return
			}
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		defer file.Close()

		img, _, err := image.Decode(file)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		rotatedImg := imaging.Rotate(img, metadata.CalculatedMetadata.Rotation, color.Alpha{})

		w.Header().Set("Content-Type", "image/png")
		err = imaging.Encode(w, rotatedImg, imaging.PNG)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
	}
}
