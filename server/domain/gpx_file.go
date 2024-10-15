package domain

import (
	"io"
	"path/filepath"

	"github.com/jamesrr39/go-errorsx"
	"github.com/tkrajina/gpxgo/gpx"
)

var _ FileParser = GpxParser{}

type GpxParser struct{}

func (g GpxParser) ParseSummary(name string, hash Hash, reader io.Reader) (*FitFileSummary, errorsx.Error) {
	gpxFile, err := gpx.Parse(reader)
	if err != nil {
		return nil, errorsx.Wrap(err)
	}

	if len(gpxFile.Tracks) != 1 {
		return nil, errorsx.Wrap(errorsx.Errorf("unsupported number of tracks in GPX file"), "tracks", len(gpxFile.Tracks))
	}

	bounds := gpxFile.Bounds()
	movingData := gpxFile.MovingData()

	// d1 := gpxFile.TimeBounds().EndTime.Sub(gpxFile.TimeBounds().StartTime)
	// TODO: use moving time/stopped time

	return &FitFileSummary{
		Name:               filepath.Base(name),
		Hash:               hash,
		StartTime:          gpxFile.TimeBounds().StartTime,
		EndTime:            gpxFile.TimeBounds().EndTime,
		DeviceManufacturer: gpxFile.Creator, DeviceProduct: gpxFile.Creator,
		TotalDistance: movingData.MovingDistance + movingData.StoppedDistance,
		ActivityBounds: &ActivityBounds{
			LatMin:  bounds.MinLatitude,
			LatMax:  bounds.MaxLatitude,
			LongMin: bounds.MinLongitude,
			LongMax: bounds.MaxLongitude,
		},
		// DeviceManufacturer string                  `json:"deviceManufacturer" required:"true"`
		// DeviceProduct      string                  `json:"deviceProduct" required:"true"`
		// TotalDistance      float64                 `json:"totalDistance" required:"true"`
		// ActivityBounds     *ActivityBounds         `json:"activityBounds" required:"true"`
		// NearbyObjects      []*GeographicMapElement `json:"nearbyObjects" required:"true" nullable:"false"`

	}, nil

}

func (g GpxParser) ParseRecords(reader io.Reader) ([]*Record, errorsx.Error) {
	gpxFile, err := gpx.Parse(reader)
	if err != nil {
		return nil, errorsx.Wrap(err)
	}

	if len(gpxFile.Tracks) != 1 {
		return nil, errorsx.Wrap(errorsx.Errorf("unsupported number of tracks in GPX file"), "tracks", len(gpxFile.Tracks))
	}

	track := gpxFile.Tracks[0]

	records := []*Record{}
	for _, segment := range track.Segments {
		for _, point := range segment.Points {
			record := Record{
				Timestamp:    point.Timestamp,
				PositionLat:  point.Latitude,
				PositionLong: point.Longitude,
				// Distance: point.
				Altitude: 0, // TODO? no Altitude data?
			}

			records = append(records, &record)
		}

	}

	return records, nil
}
