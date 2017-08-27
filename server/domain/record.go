package domain

import "time"

type Record struct {
	Timestamp    time.Time `json:"timestamp"`
	PositionLat  float64   `json:"posLat"`
	PositionLong float64   `json:"posLong"`
	Distance     uint32    `json:"distance"`
}

func NewRecord(timestamp time.Time, posLat, posLong float64, distance uint32) *Record {
	return &Record{Timestamp: timestamp, PositionLat: posLat, PositionLong: posLong, Distance: distance}
}
