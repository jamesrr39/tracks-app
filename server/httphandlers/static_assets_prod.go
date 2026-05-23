//go:build prod
// +build prod

package httphandlers

import (
	"embed"
	_ "embed"
	"io/fs"
	"net/http"
)

//go:embed static_bundle
var content embed.FS

func NewClientHandler() http.Handler {
	fs, err := fs.Sub(content, "static_bundle")
	if err != nil {
		panic(err)
	}

	return http.FileServer(http.FS(fs))
}
