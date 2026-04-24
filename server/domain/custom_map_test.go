package domain_test

import (
	"image"
	"testing"

	"github.com/jamesrr39/tracks-app/server/domain"
	"github.com/stretchr/testify/assert"
)

func TestCalculateGPSBounds(t *testing.T) {
	tests := []struct {
		name string // description of this test case
		// Named input parameters for target function.
		imgSize image.Rectangle
		p1      domain.ReferencePoint
		p2      domain.ReferencePoint
		want    domain.Bounds
	}{
		{
			imgSize: image.Rect(0, 0, 800, 600), // domain.Point{X: 800, Y: 600},
			p1: domain.ReferencePoint{
				ImageCoords: domain.Point{X: 400, Y: 300},
				Location:    domain.GPSLocation{Lat: 50.02, Lon: 0.015},
			},
			p2: domain.ReferencePoint{
				ImageCoords: domain.Point{X: 600, Y: 450},
				Location:    domain.GPSLocation{Lat: 50.03, Lon: 0.0225},
			},
			want: domain.Bounds{MinLatitude: 50.00000000000001, MaxLatitude: 50.04, MinLongitude: 0, MaxLongitude: 0.03},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := domain.CalculateImageBoundsAndRotation(tt.p1, tt.p2, tt.imgSize)
			// got := domain.CalculateGPSBounds(tt.imgSize, tt.imgPt1, tt.imgPt2, tt.gpsPt1, tt.gpsPt2)
			// TODO: update the condition below to compare got with tt.want.
			assert.Equal(t, tt.want, got)
		})
	}
}
