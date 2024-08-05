package httphandlers

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"os"
	"strconv"

	"github.com/gorilla/mux"
	openapix "github.com/jamesrr39/go-openapix"
	"github.com/jamesrr39/tracks-app/server/dal"
	"github.com/jamesrr39/tracks-app/server/domain"
	"github.com/swaggest/rest/nethttp"
	"github.com/swaggest/usecase/status"
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
	// router.HandleFunc("/", handler.handleGetAll).Methods("GET")
	// router.HandleFunc("/file", handler.handleGet).Methods("GET")
	router.HandleFunc("/laps", handler.handleGetLaps).Methods("GET")
	return handler
}

type EmptyStruct struct{}

type BuildGetAllSummariesResponse struct {
	TrackSummaries []*domain.FitFileSummary `json:"trackSummaries"`
}

func BuildGetAllSummaries(fitDAL *dal.FitDAL) *nethttp.Handler {
	return openapix.MustCreateOpenapiEndpoint(
		"Get All Track Summaries",
		&openapix.HandlerOptions{
			Tags: []string{TagTracks},
		},
		func(ctx context.Context, input *EmptyStruct, output *BuildGetAllSummariesResponse) error {
			summaries := fitDAL.GetAllSummariesInCache()

			output.TrackSummaries = summaries
			return nil
		},
	)
}

type BuildGetTrackSummaryRequest struct {
	RelativePath string `path:"path"`
}

type BuildGetTrackSummaryResponse struct {
	TrackSummary *domain.FitFileSummary `json:"trackSummary"`
}

func BuildGetTrackSummary(fitDAL *dal.FitDAL) *nethttp.Handler {
	return openapix.MustCreateOpenapiEndpoint(
		"Get Track Summary by Path",
		&openapix.HandlerOptions{
			Tags: []string{TagTracks},
		},
		func(ctx context.Context, input *BuildGetTrackSummaryRequest, output *BuildGetTrackSummaryResponse) error {
			summary, err := fitDAL.Get(input.RelativePath)
			if err != nil {
				if os.IsNotExist(err) {
					return status.Wrap(err, http.StatusNotFound)
				}

				return status.Wrap(err, http.StatusInternalServerError)
			}

			output.TrackSummary = summary.FitFileSummary
			return nil
		},
	)
}

type BuildGetTrackDetailRequest struct {
	RelativeFilePath string `path:"path"`
}

type BuildGetTrackDetailResponse struct {
	Records []*domain.Record `json:"records"`
}

func BuildGetTrackRecords(fitDAL *dal.FitDAL) *nethttp.Handler {
	return openapix.MustCreateOpenapiEndpoint(
		"Get Track Record",
		&openapix.HandlerOptions{
			Tags: []string{TagTracks},
		},
		func(ctx context.Context, input *BuildGetTrackDetailRequest, output *BuildGetTrackDetailResponse) error {
			track, err := fitDAL.Get(input.RelativeFilePath)
			if err != nil {
				if os.IsNotExist(err) {
					return status.Wrap(err, http.StatusNotFound)
				}
				return status.Wrap(err, http.StatusInternalServerError)
			}

			output.Records = track.Records
			return nil
		},
	)
}

// func (h *FitHandler) handleGet(w http.ResponseWriter, r *http.Request) {
// 	escapedFilePath := r.URL.Query().Get("filePath")

// 	filePath, err := url.QueryUnescape(escapedFilePath)
// 	if nil != err {
// 		http.Error(w, fmt.Sprintf("couldn't unescape fit file name: '%s'. Error: %s", escapedFilePath, err), 400)
// 		return
// 	}

// 	log.Println("getting fit file for " + filePath)
// 	fitFile, err := h.dal.Get(filePath)
// 	if nil != err {
// 		http.Error(w, err.Error(), 500) // todo better response codes
// 		return
// 	}

// 	w.Header().Set("Content-Type", "application/json")
// 	err = json.NewEncoder(w).Encode(fitFile)
// 	if nil != err {
// 		http.Error(w, err.Error(), 500)
// 		return
// 	}
// }

func (h *FitHandler) handleGetLaps(w http.ResponseWriter, r *http.Request) {
	incrementMetres := 1000
	var err error

	escapedFilePath := r.URL.Query().Get("filePath")

	filePath, err := url.QueryUnescape(escapedFilePath)
	if nil != err {
		http.Error(w, err.Error(), 400)
		return
	}

	incrementMetresStr := r.URL.Query().Get("lapLength")
	if incrementMetresStr != "" {
		incrementMetres, err = strconv.Atoi(incrementMetresStr)
		if nil != err {
			http.Error(w, fmt.Sprintf("couldn't convert lapLength '%s' to a number. Error: %s", incrementMetresStr, err), 400)
			return
		}
	}

	fitFile, err := h.dal.Get(filePath)
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
