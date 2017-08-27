package httphandlers

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"
	"github.com/jamesrr39/go-tracks-app/server/dal"
	"github.com/jamesrr39/go-tracks-app/server/domain"
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
	router.HandleFunc("/{fitFileName}", handler.handleGet).Methods("GET")
	router.HandleFunc("/{fitFileName}/laps", handler.handleGetLaps).Methods("GET")
	return handler
}

func (h *FitHandler) handleGetAll(w http.ResponseWriter, r *http.Request) {

	fitFilesSummaries := h.dal.GetAllSummariesInCache()
	if 0 == len(fitFilesSummaries) {
		fitFilesSummaries = []*domain.FitFileSummary{}
	}

	w.Header().Set("Content-Type", "application/json")
	err := json.NewEncoder(w).Encode(fitFilesSummaries)
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

func (h *FitHandler) handleGetLaps(w http.ResponseWriter, r *http.Request) {
	incrementMetres := 1000
	var err error

	vars := mux.Vars(r)
	fileName := vars["fitFileName"]
	incrementMetresStr := r.URL.Query().Get("lapLength")
	if incrementMetresStr != "" {
		incrementMetres, err = strconv.Atoi(incrementMetresStr)
		if nil != err {
			http.Error(w, fmt.Sprintf("couldn't convert lapLength '%s' to a number. Error: %s", incrementMetresStr, err), 400)
			return
		}
	}

	fitFile, err := h.dal.Get(fileName)
	if nil != err {
		http.Error(w, err.Error(), 500) // todo better response codes
		return
	}

	laps := fitFile.GetLaps(incrementMetres)
	w.Header().Set("Content-Type", "application/json")
	err = json.NewEncoder(w).Encode(laps)
	if nil != err {
		http.Error(w, err.Error(), 500)
		return
	}
}

func (h *FitHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	h.router.ServeHTTP(w, r)
}
