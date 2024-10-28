package domain

import (
	"io"
	"math"
	"path/filepath"
	"strings"

	"github.com/jamesrr39/go-errorsx"
	"github.com/tormoder/fit"
)

var _ FileParser = FitParser{}

type FitParser struct{}

func (p FitParser) ParseRecords(reader io.Reader) ([]*Record, errorsx.Error) {
	decodedFile, err := fit.Decode(reader)
	if nil != err {
		return nil, errorsx.Wrap(err)
	}

	activity, err := decodedFile.Activity()
	if nil != err {
		return nil, errorsx.Wrap(err)
	}

	// parse all records
	records := []*Record{}
	for _, activityRecord := range activity.Records {
		// todo handle activityRecord.PositionLat.Invalid ?
		if activityRecord.PositionLat.Invalid() || activityRecord.PositionLong.Invalid() {
			// skip (we are not interested in records without a position)
			continue
		}

		distanceScaled := activityRecord.GetDistanceScaled()

		if math.IsNaN(distanceScaled) {
			continue
		}

		var altitude *float64
		altitudeFromTrack := activityRecord.GetAltitudeScaled()
		if !math.IsNaN(altitudeFromTrack) {
			altitude = &altitudeFromTrack
		}

		record := NewRecord(
			activityRecord.Timestamp,
			activityRecord.PositionLat.Degrees(),
			activityRecord.PositionLong.Degrees(),
			round(distanceScaled),
			altitude,
		)
		records = append(records, record)
	}

	return records, nil
}

// TODO: replace in Go 1.10
func round(n float64) int {
	if n > 0 {
		return int(math.Floor(n + 0.5))
	}
	return int(math.Floor(n - 0.5))
}

// func (f *FitFile) GetLaps(incrementMetres int) []*Lap {
// 	nextIncrement := incrementMetres
// 	laps := []*Lap{}

// 	amountOfRecords := len(f.Records)
// 	if amountOfRecords == 0 {
// 		return laps
// 	}

// 	thisLap := &Lap{StartTimestamp: f.Records[0].Timestamp, StartAltitude: f.Records[0].Altitude}
// 	lastLap := &Lap{}

// 	lastIndex := amountOfRecords - 1
// 	for index, record := range f.Records {
// 		if record.Distance < nextIncrement && (index != lastIndex) {
// 			// nothing special about this record
// 			continue
// 		}

// 		distanceInLap := record.Distance - lastLap.CumulativeDistanceMetres

// 		thisLap.EndTimestamp = record.Timestamp
// 		thisLap.CumulativeDistanceMetres = record.Distance
// 		thisLap.DistanceInLapMetres = distanceInLap
// 		thisLap.EndAltitude = record.Altitude

// 		laps = append(laps, thisLap)

// 		lastLap = thisLap
// 		thisLap = &Lap{StartTimestamp: record.Timestamp, StartAltitude: record.Altitude}

// 		nextIncrement += incrementMetres
// 	}

// 	return laps
// }

func (p FitParser) ParseSummary(name string, hash Hash, reader io.Reader) (*GeoFileSummary, errorsx.Error) {
	file, err := fit.Decode(reader)
	if nil != err {
		return nil, errorsx.Wrap(err)
	}

	summary, err := newSummaryFromDecodedFitFile(name, hash, file)
	if nil != err {
		return nil, errorsx.Wrap(err)
	}

	return summary, nil
}

func newSummaryFromDecodedFitFile(relativePath string, hash Hash, file *fit.File) (*GeoFileSummary, error) {
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

	// nearbyObjects := []*GeographicMapElement{}
	// activityBounds, err := ActivityBoundsFromFitActivity(activity)
	// if err == nil {
	// 	nearbyObjects, err = nearbyObjectsFetcher.Fetch(activityBounds)
	// 	if nil != err {
	// 		return nil, err
	// 	}
	// }

	activityBounds, err := ActivityBoundsFromFitActivity(activity)
	if err != nil {
		return nil, errorsx.Wrap(err)
	}

	var deviceFragments []string

	manufacturer := file.FileId.Manufacturer.String()
	productName := file.FileId.ProductName
	if manufacturer != "" {
		deviceFragments = append(deviceFragments, manufacturer)
	}
	if productName != "" {
		deviceFragments = append(deviceFragments, productName)
	}

	return NewGeoFileSummary(
			filepath.Base(relativePath),
			relativePath,
			GeoFileTypeFIT,
			hash,
			activity.Records[0].Timestamp,
			activity.Records[len(activity.Records)-1].Timestamp,
			strings.Join(deviceFragments, " "),
			distanceScaled,
			activityBounds,
			// nearbyObjects,
		),
		nil

}
