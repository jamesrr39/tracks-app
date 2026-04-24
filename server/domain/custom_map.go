package domain

import (
	"image"
)

const CustomMapMetadataFileSuffix = ".custom_map_metadata.json"

type CustomMapMetadata struct {
	Name               string               `json:"name" required:"true"` // Taken from filename
	CalculatedMetadata ProcessedCustomImage `json:"calculatedMetadata" nullable:"false" required:"true"`
	ReferencePoints    []ReferencePoint     `json:"referencePoints" nullable:"false" required:"true"`
}

func (metadata CustomMapMetadata) CalculateMapBounds(img image.Rectangle) ProcessedCustomImage {
	// imgSize := Point{X: float64(img.Max.X), Y: float64(img.Max.Y)}
	// imgPt1 := metadata.ReferencePoints[0].ImageCoords
	// imgPt2 := metadata.ReferencePoints[1].ImageCoords
	// gpsPt1 := metadata.ReferencePoints[0].Location
	// gpsPt2 := metadata.ReferencePoints[1].Location

	return CalculateImageBoundsAndRotation(metadata.ReferencePoints[0], metadata.ReferencePoints[1], img)
	// return CalculateGPSBounds(imgSize, imgPt1, imgPt2, gpsPt1, gpsPt2)
}
