// +build prod

package httphandlers

import (
	"log"
	"net/http"

	_ "github.com/jamesrr39/tracks-app/build/client/statik"
	"github.com/rakyll/statik/fs"
)

func NewClientHandler() http.Handler {
	statikFS, err := fs.New()
	if err != nil {
		log.Fatal(err)
	}

	return http.FileServer(statikFS)
}
