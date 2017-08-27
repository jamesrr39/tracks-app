package domain

import "time"

type Lap struct {
	StartTimestamp           time.Time `json:"startTimestamp"`
	EndTimestamp             time.Time `json:"endTimestamp"`
	DistanceInLapMetres      float64   `json:"distanceInLapMetres"`
	CumulativeDistanceMetres float64   `json:"cumulativeDistanceMetres"`
}
