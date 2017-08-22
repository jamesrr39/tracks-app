package main

import (
	"net/http"
	"time"

	"github.com/gorilla/mux"
	"github.com/jamesrr39/go-tracks-app/server/dal"
	"github.com/jamesrr39/go-tracks-app/server/httphandlers"
	kingpin "gopkg.in/alecthomas/kingpin.v2"
)

func main() {
	rootDir := kingpin.Arg("rootDir", "directory that all tracks can be found under").Required().String()
	kingpin.Parse()

	fitDAL := dal.NewFitDAL(*rootDir)
	fitHandler := httphandlers.NewFitHandler(fitDAL)

	apiHandler := mux.NewRouter()
	apiHandler.PathPrefix("/fit/").Handler(http.StripPrefix("/fit", fitHandler))

	clientHandler := http.FileServer(http.Dir("client"))

	serverHandler := mux.NewRouter()
	serverHandler.PathPrefix("/api/").Handler(http.StripPrefix("/api", apiHandler))
	serverHandler.PathPrefix("/").Handler(http.StripPrefix("/", clientHandler))

	server := &http.Server{
		Addr:           ":8090",
		Handler:        serverHandler,
		ReadTimeout:    10 * time.Second,
		WriteTimeout:   10 * time.Second,
		MaxHeaderBytes: 1 << 20,
	}

	err := server.ListenAndServe()
	if nil != err {
		panic(err)
	}
}
