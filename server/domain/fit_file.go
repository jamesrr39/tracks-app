package domain

import (
	"fmt"
	"io"
	"log/slog"
	"math"
	"path/filepath"
	"strings"

	"github.com/jamesrr39/go-errorsx"
	"github.com/jamesrr39/tracks-app/server/domain/garminproducts"
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

		zeroUint16 := uint16(0)

		var power *uint16 = &zeroUint16
		if activityRecord.Power == 0 {
			power = &activityRecord.Power
		}

		zeroUint8 := uint8(0)
		var heartRate *uint8 = &zeroUint8
		if activityRecord.HeartRate == 0 {
			heartRate = &activityRecord.HeartRate
		}

		record := &Record{
			Timestamp:    activityRecord.Timestamp,
			PositionLat:  activityRecord.PositionLat.Degrees(),
			PositionLong: activityRecord.PositionLong.Degrees(),
			Distance:     round(distanceScaled),
			Altitude:     altitude,
			Power:        power,
			HeartRate:    heartRate,
		}

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

func newSummaryFromDecodedFitFile(relativePath string, hash Hash, file *fit.File) (*GeoFileSummary, errorsx.Error) {

	activity, err := file.Activity()
	if nil != err {
		return nil, errorsx.Wrap(err)
	}

	if len(activity.Records) < 1 {
		return nil, errorsx.Wrap(err)
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
	productCode := file.FileId.Product
	if manufacturer != "" {
		deviceFragments = append(deviceFragments, manufacturer)
	}

	if productCode != 0 {
		product, ok := garminproducts.GarminProductsByCodeMap[productCode]
		if !ok {
			slog.Warn("garmin product not found.", "productCode", productCode)
			deviceFragments = append(deviceFragments, fmt.Sprintf("(device not found, product code: %d)", productCode))
		} else {
			deviceFragments = append(deviceFragments, product.Name)
		}
	}

	var sport string
	for _, session := range activity.Sessions {
		if sport != "" && session.Sport.String() != sport {
			return nil, errorsx.Errorf("multiple sports not supported. first: %q, second %q", sport, session.Sport.String())
		}

		sport = session.Sport.String()
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
			sport,
		),
		nil

}
