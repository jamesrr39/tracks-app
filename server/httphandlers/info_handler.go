package httphandlers

import (
	"context"

	openapix "github.com/jamesrr39/go-openapix"
	"github.com/swaggest/rest/nethttp"
)

type InfoResponse struct {
	Version string `json:"version" required:"true"`
}

func BuildGetInfo(version string) *nethttp.Handler {
	return openapix.MustCreateOpenapiEndpoint(
		"Get service info",
		&openapix.HandlerOptions{},
		func(ctx context.Context, input *EmptyStruct, output *InfoResponse) error {
			output.Version = version
			return nil
		},
	)
}
