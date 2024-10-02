package pmtilesresources

import (
	"embed"
	"io/fs"
)

//go:embed basemaps-assets/fonts/*
var protomapsBasemapsFonts embed.FS

func ProtomapsBasemapsFonts() fs.FS {
	f, err := fs.Sub(protomapsBasemapsFonts, "basemaps-assets/fonts")
	if err != nil {
		panic(err)
	}

	return f
}

func init() {
	// app startup check for fs.Sub call and following error check
	ProtomapsBasemapsFonts()
}
