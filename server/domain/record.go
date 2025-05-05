package domain

import "time"

type Record struct {
	Timestamp    time.Time `json:"timestamp" required:"true"`
	PositionLat  float64   `json:"posLat" required:"true"`
	PositionLong float64   `json:"posLong" required:"true"`
	Distance     int       `json:"distance" required:"true"`
	Altitude     *float64  `json:"altitude" required:"true"`
	Power        *uint16   `json:"power" required:"true"`
	HeartRate    *uint8    `json:"heartRate"`
}
