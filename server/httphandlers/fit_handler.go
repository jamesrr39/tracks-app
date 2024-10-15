package httphandlers

import (
	"context"
	"net/http"
	"net/url"
	"os"

	"github.com/jamesrr39/go-errorsx"
	openapix "github.com/jamesrr39/go-openapix"
	"github.com/jamesrr39/tracks-app/server/dal"
	"github.com/jamesrr39/tracks-app/server/domain"
	"github.com/swaggest/rest/nethttp"
	"github.com/swaggest/usecase/status"
	"github.com/tkrajina/gpxgo/gpx"
	"github.com/tormoder/fit"
)

type EmptyStruct struct{}

type BuildGetAllSummariesResponse struct {
	TrackSummaries []*domain.FitFileSummary `json:"trackSummaries" nullable:"false" required:"true"`
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
	EscapedRelativePath string `path:"path"`
}

type BuildGetTrackSummaryResponse struct {
	TrackSummary *domain.FitFileSummary `json:"trackSummary" required:"true"`
}

func BuildGetTrackSummary(fitDAL *dal.FitDAL) *nethttp.Handler {
	return openapix.MustCreateOpenapiEndpoint(
		"Get Track Summary by Path",
		&openapix.HandlerOptions{
			Tags: []string{TagTracks},
		},
		func(ctx context.Context, input *BuildGetTrackSummaryRequest, output *BuildGetTrackSummaryResponse) error {
			relativePath, err := url.PathUnescape(input.EscapedRelativePath)
			if err != nil {
				return status.Wrap(err, http.StatusInternalServerError)
			}

			summary, err := fitDAL.GetSummary(relativePath)
			if err != nil {
				println(input.EscapedRelativePath, relativePath)
				e := err.(*errorsx.Err)

				println(errorsx.ErrWithStack(e).Error())
				if os.IsNotExist(err) {
					return status.Wrap(err, http.StatusNotFound)
				}

				return status.Wrap(err, http.StatusInternalServerError)
			}

			output.TrackSummary = summary
			return nil
		},
	)
}

type BuildGetTrackDetailRequest struct {
	RelativeFilePath string `path:"path"`
}

type BuildGetTrackDetailResponse struct {
	Records []*domain.Record `json:"records" nullable:"false" required:"true"`
}

func BuildGetTrackRecords(fitDAL *dal.FitDAL) *nethttp.Handler {
	return openapix.MustCreateOpenapiEndpoint(
		"Get Track Records",
		&openapix.HandlerOptions{
			Tags: []string{TagTracks},
		},
		func(ctx context.Context, input *BuildGetTrackDetailRequest, output *BuildGetTrackDetailResponse) error {
			records, err := fitDAL.GetRecords(input.RelativeFilePath)
			if err != nil {
				if os.IsNotExist(err) {
					return status.Wrap(err, http.StatusNotFound)
				}
				return status.Wrap(err, http.StatusInternalServerError)
			}

			output.Records = records
			return nil
		},
	)
}

type BuildGetParsedGpxFileResponse struct {
	File *gpx.GPX `json:"file" nullable:"false" required:"true"`
}

type BuildGetParsedGpxFileRequest struct {
	RelativeFilePath string `path:"path"`
}

func BuildGetParsedGpxFile(fitDAL *dal.FitDAL) *nethttp.Handler {
	return openapix.MustCreateOpenapiEndpoint(
		"Get parsed GPX track",
		&openapix.HandlerOptions{
			Tags: []string{TagTracks},
		},
		func(ctx context.Context, input *BuildGetParsedGpxFileRequest, output *BuildGetParsedGpxFileResponse) error {
			file, err := fitDAL.GetParsedGPXFile(input.RelativeFilePath)
			if err != nil {
				if os.IsNotExist(err) {
					return status.Wrap(err, http.StatusNotFound)
				}
				return status.Wrap(err, http.StatusInternalServerError)
			}

			output.File = file
			return nil
		},
	)
}

type BuildGetParsedFitFileResponse struct {
	File *fit.File `json:"file" nullable:"false" required:"true"`
}

type BuildGetParsedFitFileRequest struct {
	RelativeFilePath string `path:"path"`
}

func BuildGetParsedFitFile(fitDAL *dal.FitDAL) *nethttp.Handler {
	return openapix.MustCreateOpenapiEndpoint(
		"Get parsed FIT track",
		&openapix.HandlerOptions{
			Tags: []string{TagTracks},
		},
		func(ctx context.Context, input *BuildGetParsedFitFileRequest, output *BuildGetParsedFitFileResponse) error {
			file, err := fitDAL.GetParsedFitFile(input.RelativeFilePath)
			if err != nil {
				if os.IsNotExist(err) {
					return status.Wrap(err, http.StatusNotFound)
				}
				return status.Wrap(err, http.StatusInternalServerError)
			}

			output.File = file
			return nil
		},
	)
}
