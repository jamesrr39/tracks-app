package domain

import (
	"time"

	"github.com/jamesrr39/go-errorsx"
)

type SmoothedTrackRecord struct {
	Timestamp    time.Time `json:"timestamp" required:"true"`
	PositionLat  float64   `json:"posLat" required:"true"`
	PositionLong float64   `json:"posLong" required:"true"`
}

func RecordsToSmoothedRecords(records []Record, timeInterval time.Duration) ([]SmoothedTrackRecord, errorsx.Error) {
	if len(records) == 0 {
		return []SmoothedTrackRecord{}, nil
	}

	smoothedRecords := []SmoothedTrackRecord{}

	nextDuration := time.Duration(0)

	for recordIdx, record := range records {
		recordDurationThrough := record.Timestamp.Sub(records[0].Timestamp)

		if recordDurationThrough == nextDuration {
			smoothedRecords = append(smoothedRecords, SmoothedTrackRecord{
				PositionLat:  record.PositionLat,
				PositionLong: record.PositionLong,
				Timestamp:    record.Timestamp,
			})
			nextDuration += timeInterval
			continue
		}

		if recordDurationThrough > nextDuration {
			prevRecord := records[recordIdx-1]

			recordTimestampDiff := record.Timestamp.Sub(prevRecord.Timestamp)
			nextDurationDiff := recordDurationThrough - nextDuration
			decimalAmountThrough := float64(nextDurationDiff) / float64(recordTimestampDiff)

			timestampOfSmoothedRecord := prevRecord.Timestamp.Add(nextDurationDiff)

			positionLatDelta := record.PositionLat - prevRecord.PositionLat
			newLat := (positionLatDelta * decimalAmountThrough) + prevRecord.PositionLat

			positionLonDelta := record.PositionLong - prevRecord.PositionLong
			newLon := (positionLonDelta * decimalAmountThrough) + prevRecord.PositionLong

			smoothedRecords = append(smoothedRecords, SmoothedTrackRecord{
				PositionLat:  newLat,
				PositionLong: newLon,
				Timestamp:    timestampOfSmoothedRecord,
			})

			nextDuration += timeInterval
			continue
		}

		if recordIdx == len(records)-1 {
			// last record
			smoothedRecords = append(smoothedRecords, SmoothedTrackRecord{
				PositionLat:  record.PositionLat,
				PositionLong: record.PositionLong,
				Timestamp:    record.Timestamp,
			})
		}
	}

	return smoothedRecords, nil
}

func durationEquals(d1, d2 time.Duration) bool {
	return int64(d1) == int64(d2)
}
