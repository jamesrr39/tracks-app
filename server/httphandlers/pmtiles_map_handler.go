package httphandlers

import (
	"net/http"

	pmtilesresources "github.com/jamesrr39/tracks-app/server/resources/pmtiles"
)

func BuildGetPMTilesMapData(pmtilesFilePath string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, pmtilesFilePath)
	}
}

func BuildGetPMTilesBasemapAssets() http.HandlerFunc {
	fs := http.FileServer(http.FS(pmtilesresources.ProtomapsBasemapsFonts()))

	return fs.ServeHTTP
}
