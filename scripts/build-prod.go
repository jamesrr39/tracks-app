package main

import (
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"strings"

	bindata "github.com/jteeuwen/go-bindata"
)

func main() {
	mustBuildClient()
}

// must panics on error
func must(err error) {
	if nil != err {
		panic(err)
	}
}

func mustBuildClient() {
	must(os.Chdir("client"))
	must(bundleWebpack())
	must(os.Chdir(".."))

	must(copyStaticFiles())

	config := &bindata.Config{
		Package:    "clientbundle",
		Output:     "build/clientbundle/client_dist_generated.go",
		Tags:       "prod",
		Prefix:     "build/client",
		NoMetadata: true,
		Input: []bindata.InputConfig{
			bindata.InputConfig{
				Path:      "build/client",
				Recursive: true,
			},
		},
	}

	must(bindata.Translate(config))
}

func bundleWebpack() error {
	return exec.Command("yarn", "run", "bundle").Run()
}

func copyStaticFiles() error {
	files := []string{
		"client/dist/bundle.js",
		"client/dist/bundle.js.map",
		"client/index.html",
		"client/node_modules/core-js/client/shim.min.js",
		"client/node_modules/zone.js/dist/zone.js",
		"client/node_modules/reflect-metadata/Reflect.js",
		"client/node_modules/bootstrap/dist/css/bootstrap.css",
		"client/node_modules/openlayers/dist/ol.css",
	}

	for _, file := range files {
		filePath := strings.Replace(file, "/", string(filepath.Separator), -1)
		dest := filepath.Join("build", filePath)
		err := os.MkdirAll(filepath.Dir(dest), 0700)
		if nil != err {
			return err
		}

		oldFile, err := os.Open(filePath)
		if nil != err {
			return err
		}
		defer oldFile.Close()

		newFile, err := os.OpenFile(dest, os.O_CREATE|os.O_RDWR, 0600)
		if nil != err {
			return err
		}
		defer newFile.Close()

		_, err = io.Copy(newFile, oldFile)
		if nil != err {
			return err
		}
	}

	return nil
}
