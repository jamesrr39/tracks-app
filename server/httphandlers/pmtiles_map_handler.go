package httphandlers

import (
	"fmt"
	"net/http"
	"os"
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
