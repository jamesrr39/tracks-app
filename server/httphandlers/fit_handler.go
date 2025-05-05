package httphandlers

import (
	"context"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"net/url"
	"os"

	"github.com/jamesrr39/go-errorsx"
	openapix "github.com/jamesrr39/go-openapix"
	"github.com/jamesrr39/tracks-app/server/dal"
	"github.com/jamesrr39/tracks-app/server/domain"
	"github.com/swaggest/rest/nethttp"
	"github.com/swaggest/usecase"
	"github.com/swaggest/usecase/status"
	"github.com/tkrajina/gpxgo/gpx"
	"github.com/tormoder/fit"
)

type EmptyStruct struct{}

type BuildGetAllSummariesResponse struct {
	TrackSummaries []*domain.GeoFileSummary `json:"trackSummaries" nullable:"false" required:"true"`
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
	// RelativePath string `path:"path" unescape:"true"`
	RelativePath string `path:"path" escape:"true"`
}

type BuildGetTrackSummaryResponse struct {
	TrackSummary *domain.GeoFileSummary `json:"trackSummary" required:"true"`
}

func BuildGetTrackSummary(fitDAL *dal.FitDAL) *nethttp.Handler {
	return openapix.MustCreateOpenapiEndpoint(
		"Get Track Summary by Path",
		&openapix.HandlerOptions{
			Tags: []string{TagTracks},
		},
		func(ctx context.Context, input *BuildGetTrackSummaryRequest, output *BuildGetTrackSummaryResponse) error {
			relativePath, err := url.PathUnescape(input.RelativePath)
			if err != nil {
				return status.Wrap(fmt.Errorf("couldn't unescape path: %s", err.Error()), http.StatusBadRequest)
			}

			slog.Info("===", "input.RelativePath", input.RelativePath, "relativePath", relativePath)

			summary, err := fitDAL.GetSummary(relativePath)
			if err != nil {
				e := errorsx.Cause(err)
				if os.IsNotExist(e) {
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
	RelativeFilePath string `path:"path" escape:"true"`
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
			relativePath, err := url.PathUnescape(input.RelativeFilePath)
			if err != nil {
				return status.Wrap(fmt.Errorf("couldn't unescape path: %s", err.Error()), http.StatusBadRequest)
			}

			records, err := fitDAL.GetRecords(relativePath)
			if err != nil {
				e := errorsx.Cause(err)
				if os.IsNotExist(e) {
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
	RelativeFilePath string `path:"path" escape:"true"`
}

func BuildGetParsedGpxFile(fitDAL *dal.FitDAL) *nethttp.Handler {
	return openapix.MustCreateOpenapiEndpoint(
		"Get parsed GPX track",
		&openapix.HandlerOptions{
			Tags: []string{TagTracks},
		},
		func(ctx context.Context, input *BuildGetParsedGpxFileRequest, output *BuildGetParsedGpxFileResponse) error {
			relativePath, err := url.PathUnescape(input.RelativeFilePath)
			if err != nil {
				return status.Wrap(fmt.Errorf("couldn't unescape path: %s", err.Error()), http.StatusBadRequest)
			}

			file, err := fitDAL.GetParsedGPXFile(relativePath)
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
	RelativeFilePath string `path:"path" escape:"true"`
}

func BuildGetParsedFitFile(fitDAL *dal.FitDAL) *nethttp.Handler {
	return openapix.MustCreateOpenapiEndpoint(
		"Get parsed FIT track",
		&openapix.HandlerOptions{
			Tags: []string{TagTracks},
		},
		func(ctx context.Context, input *BuildGetParsedFitFileRequest, output *BuildGetParsedFitFileResponse) error {
			relativePath, err := url.PathUnescape(input.RelativeFilePath)
			if err != nil {
				return status.Wrap(fmt.Errorf("couldn't unescape path: %s", err.Error()), http.StatusBadRequest)
			}

			file, err := fitDAL.GetParsedFitFile(relativePath)
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

type BuildGetRawFileResponse struct {
	usecase.OutputWithEmbeddedWriter
}

type BuildGetRawFileRequest struct {
	RelativeFilePath string `path:"path" escape:"true"`
}

// https://swagger.io/docs/specification/v3_0/describing-responses/#response-that-returns-a-file
func BuildGetRawFile(fitDAL *dal.FitDAL) *nethttp.Handler {
	return openapix.MustCreateOpenapiEndpoint(
		"Get raw file",
		&openapix.HandlerOptions{
			Tags: []string{TagTracks},
		},
		func(ctx context.Context, input *BuildGetRawFileRequest, output *BuildGetRawFileResponse) error {
			relativePath, err := url.PathUnescape(input.RelativeFilePath)
			if err != nil {
				return status.Wrap(fmt.Errorf("couldn't unescape path: %s", err.Error()), http.StatusBadRequest)
			}

			file, err := fitDAL.GetRawFile(relativePath)
			if err != nil {
				if os.IsNotExist(err) {
					return status.Wrap(err, http.StatusNotFound)
				}
				return status.Wrap(err, http.StatusInternalServerError)
			}
			defer file.Close()

			_, err = io.Copy(output.Writer, file)
			if err != nil {
				return status.Wrap(err, http.StatusInternalServerError)
			}

			return nil
		},
	)
}
