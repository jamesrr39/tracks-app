package domain

import (
	"fmt"
	"io"
	"math"

	"github.com/tormoder/fit"
)

type FitFile struct {
	*FitFileSummary `json:"summary"`
	Records         []*Record `json:"records"`
}

func NewFitFile(name string, hash Hash, reader io.Reader) (*FitFile, error) {
	decodedFile, err := fit.Decode(reader)
	if nil != err {
		return nil, err
	}

	summary, err := newSummaryFromDecodedFitFile(name, hash, decodedFile)
	if nil != err {
		return nil, err
	}

	activity, err := decodedFile.Activity()
	if nil != err {
		return nil, fmt.Errorf("failed to get activity for %s. Error: %s", name, err)
	}

	// parse all records
	var records []*Record
	for _, activityRecord := range activity.Records {
		// todo handle activityRecord.PositionLat.Invalid ?
		if activityRecord.PositionLat.Invalid() || activityRecord.PositionLong.Invalid() {
			// skip (we are not interested in records without a position)
			continue
		}

		if math.IsNaN(float64(activityRecord.Distance)) {
			continue
		}

		record := NewRecord(
			activityRecord.Timestamp,
			activityRecord.PositionLat.Degrees(),
			activityRecord.PositionLong.Degrees(),
			activityRecord.Distance)
		records = append(records, record)
	}

	return &FitFile{FitFileSummary: summary, Records: records}, nil
}
