package domain

import (
	"fmt"
	"io"
	"math"
	"time"

	"github.com/tormoder/fit"
)

// FitFileSummary is a summary of a fit file
type FitFileSummary struct {
	Name               string    `json:"name"`
	Hash               Hash      `json:"hash"`
	StartTime          time.Time `json:"startTime"`
	EndTime            time.Time `json:"endTime"`
	DeviceManufacturer string    `json:"deviceManufacturer"`
	DeviceProduct      string    `json:"deviceProduct"`
	TotalDistance      float64   `json:"totalDistance"`
}

// NewFitFileSummary creates a new FitFileSummary
func NewFitFileSummary(name string, hash Hash, startTime, endTime time.Time, deviceManufacturer, deviceProduct string, totalDistance float64) *FitFileSummary {
	return &FitFileSummary{Name: name, Hash: hash, StartTime: startTime, EndTime: endTime, DeviceManufacturer: deviceManufacturer, DeviceProduct: deviceProduct, TotalDistance: totalDistance}
}

func NewFitFileSummaryFromReader(name string, hash Hash, reader io.Reader) (*FitFileSummary, error) {
	file, err := fit.Decode(reader)
	if nil != err {
		return nil, err
	}

	summary, err := newSummaryFromDecodedFitFile(name, hash, file)
	if nil != err {
		return nil, fmt.Errorf("failed to create a summary for %s. Error: %s", name, err)
	}

	return summary, nil
}

func newSummaryFromDecodedFitFile(name string, hash Hash, file *fit.File) (*FitFileSummary, error) {
	// sport, err := file.Sport() // TODO include sport?

	activity, err := file.Activity()
	if nil != err {
		return nil, err
	}

	if len(activity.Records) < 1 {
		return nil, err
	}

	var distanceScaled float64
	for recordIndex := len(activity.Records) - 1; recordIndex >= 0; recordIndex-- {
		record := activity.Records[recordIndex]
		if math.IsNaN(record.GetDistanceScaled()) {
			continue
		}

		distanceScaled = record.GetDistanceScaled()
		break
	}

	return NewFitFileSummary(
			name,
			hash,
			activity.Records[0].Timestamp,
			activity.Records[len(activity.Records)-1].Timestamp,
			file.FileId.Manufacturer.String(),
			file.FileId.ProductName,
			distanceScaled),
		nil

}
