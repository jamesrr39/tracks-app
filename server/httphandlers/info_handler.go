package httphandlers

import (
	"context"

	openapix "github.com/jamesrr39/go-openapix"
	"github.com/swaggest/rest/nethttp"
)

type InfoResponse struct {
	MapOptions struct {
		PMTilesSources []string `json:"pmTilesSources" nullable:"false" required:"true"`
	} `json:"mapOptions" nullable:"false" required:"true"`
}

func BuildGetInfo(pmtilesUrls []string) *nethttp.Handler {
	return openapix.MustCreateOpenapiEndpoint(
		"Get service info",
		&openapix.HandlerOptions{},
		func(ctx context.Context, input *EmptyStruct, output *InfoResponse) error {
			output.MapOptions.PMTilesSources = pmtilesUrls
			return nil
		},
	)
}
