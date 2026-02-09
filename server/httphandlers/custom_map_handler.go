package httphandlers

import (
	"context"
	"io"
	"net/http"
	"net/url"
	"os"

	"github.com/go-chi/chi/v5"
	openapix "github.com/jamesrr39/go-openapix"
	"github.com/jamesrr39/tracks-app/server/dal"
	"github.com/jamesrr39/tracks-app/server/domain"
	"github.com/swaggest/rest/nethttp"
)

type mapSourceType struct {
	Name string `json:"name"`
	URL  string `json:"url"`
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
						Name:            customMap.Name,
						Bounds:          customMap.Bounds,
						ReferencePoints: customMap.ReferencePoints,
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

func BuildGetCustomMap(customMapsDAL *dal.CustomMapsDAL) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		decodedName, err := url.PathUnescape(chi.URLParam(r, "encodedName"))
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		file, err := customMapsDAL.GetFile(decodedName)
		if os.IsNotExist(err) {
			http.Error(w, err.Error(), http.StatusNotFound)
			return
		}
		defer file.Close()

		_, err = io.Copy(w, file)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
	}
}
