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
	return CalculateImageBoundsAndRotation(metadata.ReferencePoints[0], metadata.ReferencePoints[1], img)
}
