package domain

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func Test_calculateImageRotation(t *testing.T) {
	tests := []struct {
		name string // description of this test case
		// Named input parameters for target function.
		ref1 ReferencePoint
		ref2 ReferencePoint
		want float64
	}{
		{
			name: "0 deg rotated image, already aligned",
			ref1: ReferencePoint{
				ImageCoords: Point{X: 4, Y: 4},
				Location:    GPSLocation{Lat: 50, Lon: 0},
			},
			ref2: ReferencePoint{
				ImageCoords: Point{X: 6, Y: 4},
				Location:    GPSLocation{Lat: 50, Lon: 1},
			},
			want: 0,
		},
		{
			name: "45 deg rotated image",
			ref1: ReferencePoint{
				ImageCoords: Point{X: 4, Y: 4},
				Location:    GPSLocation{Lat: 50, Lon: 0},
			},
			ref2: ReferencePoint{
				ImageCoords: Point{X: 6, Y: 6},
				Location:    GPSLocation{Lat: 50, Lon: 1},
			},
			want: 45,
		},
		{
			name: "90 deg rotated image",
			ref1: ReferencePoint{
				ImageCoords: Point{X: 4, Y: 4},
				Location:    GPSLocation{Lat: 50, Lon: 0},
			},
			ref2: ReferencePoint{
				ImageCoords: Point{X: 4, Y: 6},
				Location:    GPSLocation{Lat: 50, Lon: 1},
			},
			want: 90,
		},
		{
			name: "135 deg rotated image",
			ref1: ReferencePoint{
				ImageCoords: Point{X: 4, Y: 4},
				Location:    GPSLocation{Lat: 50, Lon: 0},
			},
			ref2: ReferencePoint{
				ImageCoords: Point{X: 2, Y: 6},
				Location:    GPSLocation{Lat: 50, Lon: 1},
			},
			want: 135,
		},
		{
			name: "180 deg rotated image",
			ref1: ReferencePoint{
				ImageCoords: Point{X: 4, Y: 4},
				Location:    GPSLocation{Lat: 50, Lon: 0},
			},
			ref2: ReferencePoint{
				ImageCoords: Point{X: 2, Y: 4},
				Location:    GPSLocation{Lat: 50, Lon: 1},
			},
			want: 180,
		},
		{
			name: "225 deg rotated image",
			ref1: ReferencePoint{
				ImageCoords: Point{X: 4, Y: 4},
				Location:    GPSLocation{Lat: 50, Lon: 0},
			},
			ref2: ReferencePoint{
				ImageCoords: Point{X: 2, Y: 2},
				Location:    GPSLocation{Lat: 50, Lon: 1},
			},
			want: 225,
		},
		{
			name: "270 deg rotated image",
			ref1: ReferencePoint{
				ImageCoords: Point{X: 4, Y: 4},
				Location:    GPSLocation{Lat: 50, Lon: 0},
			},
			ref2: ReferencePoint{
				ImageCoords: Point{X: 4, Y: 2},
				Location:    GPSLocation{Lat: 50, Lon: 1},
			},
			want: 270,
		},
		{
			name: "315 deg rotated image",
			ref1: ReferencePoint{
				ImageCoords: Point{X: 4, Y: 4},
				Location:    GPSLocation{Lat: 50, Lon: 0},
			},
			ref2: ReferencePoint{
				ImageCoords: Point{X: 6, Y: 2},
				Location:    GPSLocation{Lat: 50, Lon: 1},
			},
			want: 315,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := calculateImageRotation(tt.ref1, tt.ref2)
			assert.Equal(t, tt.want, got)
		})
	}
}
