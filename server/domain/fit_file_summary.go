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
	Name               string                  `json:"name"`
	Hash               Hash                    `json:"hash"`
	StartTime          time.Time               `json:"startTime"`
	EndTime            time.Time               `json:"endTime"`
	DeviceManufacturer string                  `json:"deviceManufacturer"`
	DeviceProduct      string                  `json:"deviceProduct"`
	TotalDistance      float64                 `json:"totalDistance"`
	ActivityBounds     *ActivityBounds         `json:"activityBounds"`
	NearbyObjects      []*GeographicMapElement `json:"nearbyObjects"`
}

// NewFitFileSummary creates a new FitFileSummary
func NewFitFileSummary(name string, hash Hash, startTime, endTime time.Time, deviceManufacturer, deviceProduct string, totalDistance float64, activityBounds *ActivityBounds, nearbyObjects []*GeographicMapElement) *FitFileSummary {
	return &FitFileSummary{name, hash, startTime, endTime, deviceManufacturer, deviceProduct, totalDistance, activityBounds, nearbyObjects}
}

func NewFitFileSummaryFromReader(name string, hash Hash, reader io.Reader, nearbyObjectsFetcher NearbyObjectsFetcher) (*FitFileSummary, error) {
	file, err := fit.Decode(reader)
	if nil != err {
		return nil, err
	}

	summary, err := newSummaryFromDecodedFitFile(name, hash, file, nearbyObjectsFetcher)
	if nil != err {
		return nil, fmt.Errorf("failed to create a summary for %s. Error: %s", name, err)
	}

	return summary, nil
}

func newSummaryFromDecodedFitFile(name string, hash Hash, file *fit.File, nearbyObjectsFetcher NearbyObjectsFetcher) (*FitFileSummary, error) {
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

	nearbyObjects := []*GeographicMapElement{}
	activityBounds, err := ActivityBoundsFromFitActivity(activity)
	if err == nil {
		nearbyObjects, err = nearbyObjectsFetcher.Fetch(activityBounds)
		if nil != err {
			return nil, err
		}
	}

	return NewFitFileSummary(
			name,
			hash,
			activity.Records[0].Timestamp,
			activity.Records[len(activity.Records)-1].Timestamp,
			file.FileId.Manufacturer.String(),
			file.FileId.ProductName,
			distanceScaled,
			activityBounds,
			nearbyObjects,
		),
		nil

}
