package domain

import (
	"io"
	"time"

	"github.com/jamesrr39/go-errorsx"
)

type FileParser interface {
	ParseSummary(relativeFilePath string, hash Hash, reader io.Reader) (*GeoFileSummary, errorsx.Error)
	ParseRecords(reader io.Reader) ([]*Record, errorsx.Error)
	// TODO: ParseLaps?
}

type GeoFileType string

const (
	GeoFileTypeFIT GeoFileType = "FIT"
	GeoFileTypeGPX GeoFileType = "GPX"
)

// GeoFileSummary is a summary of a fit file
type GeoFileSummary struct {
	Name             string          `json:"name" required:"true"`
	RelativeFilePath string          `json:"relativeFilePath" required:"true"`
	Type             GeoFileType     `json:"geoFileType" required:"true" enum:"FIT,GPX"`
	Hash             Hash            `json:"hash" required:"true"`
	StartTime        time.Time       `json:"startTime" required:"true"`
	EndTime          time.Time       `json:"endTime" required:"true"`
	Device           string          `json:"device" required:"true"`
	TotalDistance    float64         `json:"totalDistance" required:"true"`
	ActivityBounds   *ActivityBounds `json:"activityBounds" required:"true"`
	// NearbyObjects      []*GeographicMapElement `json:"nearbyObjects" required:"true" nullable:"false"`
}

// NewGeoFileSummary creates a new FitFileSummary
func NewGeoFileSummary(name, relativeFilePath string, geoFileType GeoFileType, hash Hash, startTime, endTime time.Time, device string, totalDistance float64, activityBounds *ActivityBounds) *GeoFileSummary {
	return &GeoFileSummary{name, relativeFilePath, geoFileType, hash, startTime, endTime, device, totalDistance, activityBounds}
}
