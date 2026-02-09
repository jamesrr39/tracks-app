package domain_test

import (
	"testing"

	"github.com/jamesrr39/tracks-app/server/domain"
	"github.com/stretchr/testify/assert"
)

func TestCalculateGPSBounds(t *testing.T) {
	tests := []struct {
		name string // description of this test case
		// Named input parameters for target function.
		imgSize domain.Point
		imgPt1  domain.Point
		imgPt2  domain.Point
		gpsPt1  domain.GPSLocation
		gpsPt2  domain.GPSLocation
		want    domain.Bounds
	}{
		{
			imgSize: domain.Point{X: 800, Y: 600},
			imgPt1:  domain.Point{X: 400, Y: 300},
			imgPt2:  domain.Point{X: 600, Y: 450},
			gpsPt1:  domain.GPSLocation{Lat: 50.02, Lon: 0.015},
			gpsPt2:  domain.GPSLocation{Lat: 50.03, Lon: 0.0225},
			want:    domain.Bounds{MinLatitude: 50.00000000000001, MaxLatitude: 50.04, MinLongitude: 0, MaxLongitude: 0.03},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := domain.CalculateGPSBounds(tt.imgSize, tt.imgPt1, tt.imgPt2, tt.gpsPt1, tt.gpsPt2)
			// TODO: update the condition below to compare got with tt.want.
			assert.Equal(t, tt.want, got)
		})
	}
}
