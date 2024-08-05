package domain

import "time"

type Record struct {
	Timestamp    time.Time `json:"timestamp" required:"true"`
	PositionLat  float64   `json:"posLat" required:"true"`
	PositionLong float64   `json:"posLong" required:"true"`
	Distance     int       `json:"distance" required:"true"`
	Altitude     int       `json:"altitude" required:"true"`
}

func NewRecord(timestamp time.Time, posLat, posLong float64, distance, altitude int) *Record {
	return &Record{Timestamp: timestamp, PositionLat: posLat, PositionLong: posLong, Distance: distance, Altitude: altitude}
}
