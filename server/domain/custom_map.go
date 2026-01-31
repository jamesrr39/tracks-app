package domain

import (
	"image"
	"math"
)

const CustomMapMetadataFileSuffix = ".custom_map_metadata.json"

type CustomMapMetadata struct {
	Name            string           `json:"name"` // Taken from filename
	Bounds          Bounds           `json:"bounds" nullable:"false" required:"true"`
	ReferencePoints []ReferencePoint `json:"referencePoints" nullable:"false" required:"true"`
}

type Bounds struct {
	MinLatitude  float64 `json:"minLat"`
	MaxLatitude  float64 `json:"maxLat"`
	MinLongitude float64 `json:"minLon"`
	MaxLongitude float64 `json:"maxLon"`
}

type ReferencePoint struct {
	ImageCoords Point       `json:"imageCoords"` // top-left of image = 0,0
	Location    GPSLocation `json:"location"`
}

type GPSLocation struct {
	Lat float64 `json:"lat"`
	Lon float64 `json:"lon"`
}

func (metadata CustomMapMetadata) CalculateMapBounds(img image.Rectangle) Bounds {
	imgSize := Point{X: float64(img.Max.X), Y: float64(img.Max.Y)}
	imgPt1 := Point{
		X: float64(metadata.ReferencePoints[0].ImageCoords.X),
		Y: float64(metadata.ReferencePoints[0].ImageCoords.Y),
	}
	imgPt2 := Point{
		X: float64(metadata.ReferencePoints[1].ImageCoords.X),
		Y: float64(metadata.ReferencePoints[1].ImageCoords.Y),
	}
	gpsPt1 := metadata.ReferencePoints[0].Location
	gpsPt2 := metadata.ReferencePoints[1].Location
	// gpsPt1 := GPS{
	// 	Lat: metadata.ReferencePoints[0].Location.Lat,
	// 	Lon: metadata.ReferencePoints[0].Location.Lon,
	// }
	// gpsPt2 := GPS{
	// 	Lat: metadata.ReferencePoints[1].Location.Lat,
	// 	Lon: metadata.ReferencePoints[1].Location.Lon,
	// }

	return CalculateGPSBounds(imgSize, imgPt1, imgPt2, gpsPt1, gpsPt2)
}

type Point struct {
	X float64
	Y float64
}

// CalculateGPSBounds calculates the GPS bounding box of an image given two reference points
// imgSize: width and height of the image in pixels
// imgPt1, imgPt2: two points on the image (pixel coordinates)
// gpsPt1, gpsPt2: corresponding GPS coordinates for the two image points
// Returns GPS bounds: minLat, minLon, maxLat, maxLon
func CalculateGPSBounds(imgSize Point, imgPt1, imgPt2 Point, gpsPt1, gpsPt2 GPSLocation) Bounds {
	// Calculate scale factors for latitude and longitude per pixel
	latPerPixel := (gpsPt2.Lat - gpsPt1.Lat) / (imgPt2.Y - imgPt1.Y)
	lonPerPixel := (gpsPt2.Lon - gpsPt1.Lon) / (imgPt2.X - imgPt1.X)

	// Calculate GPS coordinates for the four corners of the image
	// Top-left corner (0,0)
	topLeftLat := gpsPt1.Lat + latPerPixel*(0-imgPt1.Y)
	topLeftLon := gpsPt1.Lon + lonPerPixel*(0-imgPt1.X)

	// Top-right corner (imgSize.X, 0)
	topRightLat := gpsPt1.Lat + latPerPixel*(0-imgPt1.Y)
	topRightLon := gpsPt1.Lon + lonPerPixel*(imgSize.X-imgPt1.X)

	// Bottom-left corner (0, imgSize.Y)
	bottomLeftLat := gpsPt1.Lat + latPerPixel*(imgSize.Y-imgPt1.Y)
	bottomLeftLon := gpsPt1.Lon + lonPerPixel*(0-imgPt1.X)

	// Bottom-right corner (imgSize.X, imgSize.Y)
	bottomRightLat := gpsPt1.Lat + latPerPixel*(imgSize.Y-imgPt1.Y)
	bottomRightLon := gpsPt1.Lon + lonPerPixel*(imgSize.X-imgPt1.X)

	// Find min and max latitudes
	minLat := math.Min(math.Min(topLeftLat, topRightLat), math.Min(bottomLeftLat, bottomRightLat))
	maxLat := math.Max(math.Max(topLeftLat, topRightLat), math.Max(bottomLeftLat, bottomRightLat))

	// Find min and max longitudes
	minLon := math.Min(math.Min(topLeftLon, topRightLon), math.Min(bottomLeftLon, bottomRightLon))
	maxLon := math.Max(math.Max(topLeftLon, topRightLon), math.Max(bottomLeftLon, bottomRightLon))

	return Bounds{
		MinLatitude:  minLat,
		MaxLatitude:  maxLat,
		MinLongitude: minLon,
		MaxLongitude: maxLon,
	}
}
