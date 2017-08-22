package httphandlers

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/gorilla/mux"
	"github.com/jamesrr39/go-tracks-app/server/dal"
)

// FitHandler is an HTTP handler for fit files
type FitHandler struct {
	dal    *dal.FitDAL
	router *mux.Router
}

// NewFitHandler creates a new FitHandler
func NewFitHandler(dal *dal.FitDAL) *FitHandler {
	router := mux.NewRouter()
	handler := &FitHandler{dal: dal, router: router}
	router.HandleFunc("/", handler.handleGetAll).Methods("GET")
	router.PathPrefix("/{fitFileName}").HandlerFunc(handler.handleGet).Methods("GET")
	return handler
}

func (h *FitHandler) handleGetAll(w http.ResponseWriter, r *http.Request) {

	fitFilesSummaries, err := h.dal.GetAll()
	if nil != err {
		http.Error(w, "couldn't get fit tracks. Error: "+err.Error(), 500)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	err = json.NewEncoder(w).Encode(fitFilesSummaries)
	if nil != err {
		http.Error(w, "couldn't encode fit tracks to json. Error: "+err.Error(), 500)
		return
	}
}

func (h *FitHandler) handleGet(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	fileName := vars["fitFileName"]

	log.Println("getting fit file for " + fileName)
	fitFile, err := h.dal.Get(fileName)
	if nil != err {
		http.Error(w, err.Error(), 500) // todo better response codes
		return
	}

	w.Header().Set("Content-Type", "application/json")
	err = json.NewEncoder(w).Encode(fitFile)
	if nil != err {
		http.Error(w, err.Error(), 500)
		return
	}

}

func (h *FitHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	h.router.ServeHTTP(w, r)
}
