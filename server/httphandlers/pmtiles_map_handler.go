package httphandlers

import (
	"fmt"
	"net/http"
	"os"

	pmtilesresources "github.com/jamesrr39/tracks-app/server/resources/pmtiles"
)

func BuildGetPMTilesMapData(pmtilesFilePath string) http.HandlerFunc {
	_, err := os.Stat(pmtilesFilePath)
	if err != nil {
		panic(fmt.Sprintf("Error 'stat'ing PM tiles file path (%s). Error: %s", pmtilesFilePath, err))
	}
	return func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, pmtilesFilePath)
	}
}

func BuildGetPMTilesBasemapAssets() http.HandlerFunc {
	fs := http.FileServer(http.FS(pmtilesresources.ProtomapsBasemapsFonts()))

	return fs.ServeHTTP
}
