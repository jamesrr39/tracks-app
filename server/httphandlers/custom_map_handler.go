package httphandlers

import (
	"context"
	"fmt"
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

type GetCustomMapsResponse struct {
	CustomMaps []CustomMap `json:"customMaps" nullable:"false" required:"true"`
}

type CustomMap struct {
	domain.CustomMapMetadata
	Link string `json:"link" required:"true"`
}

func BuildGetCustomMaps(customMapsDAL *dal.CustomMapsDAL) *nethttp.Handler {
	return openapix.MustCreateOpenapiEndpoint(
		"Get custom maps",
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
					Link: fmt.Sprintf("/map/custom-map/%s", url.PathEscape(customMap.Name)),
				}

				output.CustomMaps = append(output.CustomMaps, m)
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
