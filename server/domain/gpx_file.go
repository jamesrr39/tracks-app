package domain

import (
	"io"
	"math"

	"github.com/jamesrr39/go-errorsx"
	"github.com/tkrajina/gpxgo/gpx"
)

var _ FileParser = GpxParser{}

type GpxParser struct{}

func (g GpxParser) ParseSummary(relativeFilePath string, hash Hash, reader io.Reader) (*GeoFileSummary, errorsx.Error) {
	gpxFile, err := gpx.Parse(reader)
	if err != nil {
		return nil, errorsx.Wrap(err)
	}

	if len(gpxFile.Tracks) != 1 {
		return nil, errorsx.Wrap(errorsx.Errorf("unsupported number of tracks in GPX file"), "tracks", len(gpxFile.Tracks))
	}

	track := gpxFile.Tracks[0]

	bounds := gpxFile.Bounds()
	movingData := gpxFile.MovingData()

	return NewGeoFileSummary(
		// filepath.Base(relativeFilePath),
		track.Name,
		relativeFilePath,
		GeoFileTypeGPX,
		hash,
		gpxFile.TimeBounds().StartTime,
		gpxFile.TimeBounds().EndTime,
		gpxFile.Creator,
		movingData.MovingDistance+movingData.StoppedDistance,
		&ActivityBounds{
			LatMin:  bounds.MinLatitude,
			LatMax:  bounds.MaxLatitude,
			LongMin: bounds.MinLongitude,
			LongMax: bounds.MaxLongitude,
		},
	), nil

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

	if len(track.Segments) == 0 || len(track.Segments[0].Points) == 0 {
		return nil, errorsx.Wrap(errorsx.Errorf("no segments in first track, or no points in first segment in GPX file"), "segments count", len(track.Segments))
	}

	cumulativeDistanceMetres := float64(0)
	var prevPoint *gpx.GPXPoint

	records := []*Record{}
	for _, segment := range track.Segments {
		for _, point := range segment.Points {
			var distanceFromLastPointKm float64
			if prevPoint != nil {
				distanceFromLastPointKm = point.Distance3D(prevPoint)
			}

			cumulativeDistanceMetres += distanceFromLastPointKm / 1000

			var altitude *float64
			if point.Elevation.NotNull() {
				val := point.Elevation.Value()
				altitude = &val
			}

			record := Record{
				Timestamp:    point.Timestamp,
				PositionLat:  point.Latitude,
				PositionLong: point.Longitude,
				Distance:     int(math.Round(cumulativeDistanceMetres)),
				Altitude:     altitude,
			}

			records = append(records, &record)
			prevPoint = &point
		}

	}

	return records, nil
}
