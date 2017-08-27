package domain

import (
	"fmt"
	"io"
	"math"

	"github.com/tormoder/fit"
)

type ActivityBounds struct {
	LatMin  float64 `json:"latMin"`  // between -90 (south pole) and +90 (north pole)
	LatMax  float64 `json:"latMax"`  // between -90 (south pole) and +90 (north pole)
	LongMin float64 `json:"longMin"` // between -180 and +180
	LongMax float64 `json:"longMax"` // between -180 and +180
}

type FitFile struct {
	*FitFileSummary `json:"summary"`
	Records         []*Record `json:"records"`
	*ActivityBounds `json:"activityBounds"`
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

	activityBounds := &ActivityBounds{90, -90, 180, -180}

	// parse all records
	var records []*Record
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

		posLat := activityRecord.PositionLat.Degrees()
		if posLat < activityBounds.LatMin {
			activityBounds.LatMin = posLat
		}

		if posLat > activityBounds.LatMax {
			activityBounds.LatMax = posLat
		}

		posLong := activityRecord.PositionLong.Degrees()
		if posLong < activityBounds.LongMin {
			activityBounds.LongMin = posLong
		}

		if posLong > activityBounds.LongMax {
			activityBounds.LongMax = posLong
		}

		record := NewRecord(
			activityRecord.Timestamp,
			activityRecord.PositionLat.Degrees(),
			activityRecord.PositionLong.Degrees(),
			round(distanceScaled),
			round(activityRecord.GetAltitudeScaled()))
		records = append(records, record)
	}

	return &FitFile{FitFileSummary: summary, Records: records, ActivityBounds: activityBounds}, nil
}

func round(n float64) int {
	if n > 0 {
		return int(math.Floor(n + 0.5))
	}
	return int(math.Floor(n - 0.5))
}

func (f *FitFile) GetLaps(incrementMetres int) []*Lap {
	nextIncrement := incrementMetres
	var laps []*Lap

	amountOfRecords := len(f.Records)
	if amountOfRecords == 0 {
		return laps
	}

	thisLap := &Lap{StartTimestamp: f.Records[0].Timestamp, StartAltitude: f.Records[0].Altitude}
	lastLap := &Lap{}

	lastIndex := amountOfRecords - 1
	for index, record := range f.Records {
		if record.Distance < nextIncrement && (index != lastIndex) {
			// nothing special about this record
			continue
		}

		distanceInLap := record.Distance - lastLap.CumulativeDistanceMetres

		thisLap.EndTimestamp = record.Timestamp
		thisLap.CumulativeDistanceMetres = record.Distance
		thisLap.DistanceInLapMetres = distanceInLap
		thisLap.EndAltitude = record.Altitude

		laps = append(laps, thisLap)

		lastLap = thisLap
		thisLap = &Lap{StartTimestamp: record.Timestamp, StartAltitude: record.Altitude}

		nextIncrement += incrementMetres
	}

	return laps
}
