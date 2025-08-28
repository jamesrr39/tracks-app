package httphandlers

import (
	"context"

	openapix "github.com/jamesrr39/go-openapix"
	"github.com/swaggest/rest/nethttp"
)

type mapSourceType struct {
	Name string `json:"name"`
	URL  string `json:"url"`
}

type InfoResponse struct {
	MapOptions struct {
		Sources []mapSourceType `json:"sources" nullable:"false" required:"true"`
	} `json:"mapOptions" nullable:"false" required:"true"`
}

func BuildGetInfo(pmtilesUrl string) *nethttp.Handler {
	return openapix.MustCreateOpenapiEndpoint(
		"Get service info",
		&openapix.HandlerOptions{},
		func(ctx context.Context, input *EmptyStruct, output *InfoResponse) error {
			output.MapOptions.Sources = append(output.MapOptions.Sources, []mapSourceType{
				{Name: "OpenFreeMap - Positron", URL: "https://tiles.openfreemap.org/styles/positron"},
				{Name: "OpenFreeMap - Bright", URL: "https://tiles.openfreemap.org/styles/bright"},
				{Name: "OpenFreeMap - Liberty", URL: "https://tiles.openfreemap.org/styles/liberty"},
			}...)
			if pmtilesUrl != "" {
				output.MapOptions.Sources = append(output.MapOptions.Sources, mapSourceType{
					Name: "Promomaps", URL: pmtilesUrl,
				})
			}

			return nil
		},
	)
}
