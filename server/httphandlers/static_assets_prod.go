// +build prod

package httphandlers

import (
	"fmt"
	"net/http"
	"strings"

	clientbundle "github.com/jamesrr39/tracks-app/build/clientbundle"
)

func NewClientHandler() http.Handler {
	return &ClientHandler{}
}

type ClientHandler struct{}

func (h *ClientHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	originalPath := r.URL.Path
	path := strings.TrimPrefix(originalPath, "/")
	if path == "" {
		path = "index.html"
	}

	assetBytes, err := clientbundle.Asset(path)
	if nil != err {
		http.Error(w, err.Error(), 404)
		return
	}

	_, err = w.Write(assetBytes)
	if nil != err {
		http.Error(w, fmt.Sprintf("couldn't write to the response. Error: %s\n", err), 500)
		return
	}
}
