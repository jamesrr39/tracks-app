package main

import (
	"log"
	"net/http"
	"time"

	"github.com/gorilla/mux"
	"github.com/jamesrr39/go-tracks-app/clienthandler"
	"github.com/jamesrr39/go-tracks-app/server/dal"
	"github.com/jamesrr39/go-tracks-app/server/httphandlers"
	"github.com/jamesrr39/goutil/userextra"

	kingpin "gopkg.in/alecthomas/kingpin.v2"
)

func main() {
	rootDir := kingpin.Arg("rootDir", "directory that all tracks can be found under").Required().String()
	unexpandedCachesDir := kingpin.Flag("caches-dir", "directory to store the caches in").Default("~/.caches/github.com/jamesrr39/go-tracks-app").String()

	kingpin.Parse()

	cachesDir, err := userextra.ExpandUser(*unexpandedCachesDir)
	if nil != err {
		log.Fatalln(err)
	}

	fitDAL, err := dal.NewFitDALAndScan(*rootDir, cachesDir)
	if nil != err {
		log.Fatalf("failed to create a new dal and scan the files under %s. Error: %s\n", *rootDir, err)
	}

	fitHandler := httphandlers.NewFitHandler(fitDAL)

	apiHandler := mux.NewRouter()
	apiHandler.PathPrefix("/fit/").Handler(http.StripPrefix("/fit", fitHandler))

	serverHandler := mux.NewRouter()
	serverHandler.PathPrefix("/api/").Handler(http.StripPrefix("/api", apiHandler))

	serverHandler.PathPrefix("/").Handler(clienthandler.GetClientHandler())

	addr := ":8090"
	log.Printf("attempting to broadcast on '%s'\n", addr)

	server := &http.Server{
		Addr:           addr,
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
