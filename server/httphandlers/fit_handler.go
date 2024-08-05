package httphandlers

import (
	"context"
	"net/http"
	"os"

	openapix "github.com/jamesrr39/go-openapix"
	"github.com/jamesrr39/tracks-app/server/dal"
	"github.com/jamesrr39/tracks-app/server/domain"
	"github.com/swaggest/rest/nethttp"
	"github.com/swaggest/usecase/status"
)

type EmptyStruct struct{}

type BuildGetAllSummariesResponse struct {
	TrackSummaries []*domain.FitFileSummary `json:"trackSummaries" nullable:"false"`
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
	Records []*domain.Record `json:"records" nullable:"false"`
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
