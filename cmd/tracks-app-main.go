package main

import (
	"log"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/gorilla/mux"
	"github.com/jamesrr39/goutil/userextra"
	"github.com/jamesrr39/tracks-app/server/dal"
	"github.com/jamesrr39/tracks-app/server/diskcache"
	"github.com/jamesrr39/tracks-app/server/externalservices/overpass"
	"github.com/jamesrr39/tracks-app/server/httphandlers"

	kingpin "gopkg.in/alecthomas/kingpin.v2"
)

func main() {
	rootDir := kingpin.Arg("rootDir", "directory that all tracks can be found under").Required().String()
	unexpandedCachesDir := kingpin.Flag("caches-dir", "directory to store the caches in").Default("~/.cache/github.com/jamesrr39/tracks-app").String()
	addr := kingpin.Flag("addr", "address and port to serve on. ':8090' = to everyone on port 8090. 'localhost:8090' = to only localhost on 8090").Default("localhost:8090").String()

	kingpin.Parse()

	cachesDir, err := userextra.ExpandUser(*unexpandedCachesDir)
	if nil != err {
		log.Fatalln(err)
	}

	err = os.MkdirAll(cachesDir, 0700)
	if nil != err {
		log.Fatalln(err)
	}

	cacheDBPath := filepath.Join(cachesDir, "tracks-cache-bolt.db")
	cacheDBConn, err := diskcache.NewConn(cacheDBPath)
	if nil != err {
		log.Fatalln(err)
	}

	fitDAL, err := dal.NewFitDALAndScan(*rootDir, cachesDir, overpass.NewOverpassNearbyCityDataFetcher(time.Second*10, 2, cacheDBConn))
	if nil != err {
		log.Fatalf("failed to create a new dal and scan the files under %s. Error: %s\n", *rootDir, err)
	}

	fitHandler := httphandlers.NewFitHandler(fitDAL)

	apiHandler := mux.NewRouter()
	apiHandler.PathPrefix("/tracks/").Handler(http.StripPrefix("/tracks", fitHandler))

	serverHandler := mux.NewRouter()
	serverHandler.PathPrefix("/api/").Handler(http.StripPrefix("/api", apiHandler))
	serverHandler.PathPrefix("/").Handler(http.StripPrefix("/", httphandlers.NewClientHandler()))

	log.Printf("attempting to broadcast on '%s'\n", *addr)

	server := &http.Server{
		Addr:           *addr,
		Handler:        serverHandler,
		ReadTimeout:    10 * time.Second,
		WriteTimeout:   10 * time.Second,
		MaxHeaderBytes: 1 << 20,
	}

	err = server.ListenAndServe()
	if nil != err {
		panic(err)
	}
}
