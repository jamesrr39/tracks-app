package domain

import (
	"image"
	"log"
	"math"
)

type ProcessedCustomImage struct {
	Rotation float64 `json:"rotation" required:"true"` // degrees clockwise from north
	Bounds   Bounds  `json:"bounds" nullable:"false" required:"true"`
}

// Bounds represents the GPS bounds and rotation of an image.
type Bounds struct {
	MinLatitude  float64 `json:"minLat" required:"true"`
	MaxLatitude  float64 `json:"maxLat" required:"true"`
	MinLongitude float64 `json:"minLon" required:"true"`
	MaxLongitude float64 `json:"maxLon" required:"true"`
}

// Point represents 2D coordinates.
type Point struct {
	X float64 `json:"x" required:"true"`
	Y float64 `json:"y" required:"true"`
}

// GPSLocation represents GPS coordinates.
type GPSLocation struct {
	Lat float64 `json:"lat" required:"true"`
	Lon float64 `json:"lon" required:"true"`
}

// ReferencePoint represents a reference point with image and GPS coordinates.
type ReferencePoint struct {
	ImageCoords Point       `json:"imageCoords" required:"true"` // top-left of image = 0,0
	Location    GPSLocation `json:"location" required:"true"`
}

// CalculateImageBoundsAndRotation calculates the GPS bounds and rotation of an image
// based on two reference points and the image size.
func CalculateImageBoundsAndRotation(
	ref1, ref2 ReferencePoint,
	imageSize image.Rectangle,
) ProcessedCustomImage {
	// Calculate the four corners of the image in pixel coordinates
	corners := []Point{
		{0, 0},                       // Top-left
		{float64(imageSize.Dx()), 0}, // Top-right
		{float64(imageSize.Dx()), float64(imageSize.Dy())}, // Bottom-right
		{0, float64(imageSize.Dy())},                       // Bottom-left
	}

	// Calculate the GPS coordinates for all four corners
	gpsCorners := make([]GPSLocation, 4)
	for i, corner := range corners {
		gpsCorners[i] = pixelToGPS(corner, ref1, ref2)
	}

	// Calculate min/max latitude and longitude
	minLat := gpsCorners[0].Lat
	maxLat := gpsCorners[0].Lat
	minLon := gpsCorners[0].Lon
	maxLon := gpsCorners[0].Lon

	for _, loc := range gpsCorners[1:] {
		if loc.Lat < minLat {
			minLat = loc.Lat
		}
		if loc.Lat > maxLat {
			maxLat = loc.Lat
		}
		if loc.Lon < minLon {
			minLon = loc.Lon
		}
		if loc.Lon > maxLon {
			maxLon = loc.Lon
		}
	}

	// Calculate rotation (angle between image x-axis and true north)
	rotation := calculateImageRotation(ref1, ref2)

	return ProcessedCustomImage{
		Bounds: Bounds{
			MinLatitude:  minLat,
			MaxLatitude:  maxLat,
			MinLongitude: minLon,
			MaxLongitude: maxLon,
		},
		Rotation: rotation,
	}
}

// pixelToGPS converts pixel coordinates to GPS coordinates using linear interpolation
// between the two reference points.
func pixelToGPS(pixel Point, ref1, ref2 ReferencePoint) GPSLocation {
	// Calculate the vector from ref1 to ref2 in pixel space
	deltaX := ref2.ImageCoords.X - ref1.ImageCoords.X
	deltaY := ref2.ImageCoords.Y - ref1.ImageCoords.Y

	// If the reference points are the same, return ref1's location
	if deltaX == 0 && deltaY == 0 {
		return ref1.Location
	}

	// Calculate the relative position of the pixel between ref1 and ref2
	relX := (pixel.X - ref1.ImageCoords.X) / deltaX
	relY := (pixel.Y - ref1.ImageCoords.Y) / deltaY

	// Clamp the relative position to [0, 1] to ensure it's within the segment
	relX = math.Max(0, math.Min(1, relX))
	relY = math.Max(0, math.Min(1, relY))

	// Linearly interpolate between ref1 and ref2 in GPS space
	deltaLat := ref2.Location.Lat - ref1.Location.Lat
	deltaLon := ref2.Location.Lon - ref1.Location.Lon

	interpolatedLat := ref1.Location.Lat + relX*deltaLat
	interpolatedLon := ref1.Location.Lon + relY*deltaLon

	return GPSLocation{
		Lat: interpolatedLat,
		Lon: interpolatedLon,
	}
}

// calculateImageRotation calculates the rotation of the image's x-axis relative to true north.
func calculateImageRotation(ref1, ref2 ReferencePoint) float64 {
	// Calculate the vector from ref1 to ref2 in pixel space
	deltaX := ref2.ImageCoords.X - ref1.ImageCoords.X
	deltaY := ref2.ImageCoords.Y - ref1.ImageCoords.Y

	// If the reference points are the same, rotation is 0
	if deltaX == 0 && deltaY == 0 {
		panic("need two seperate points")
	}

	// Calculate the bearing from ref1 to ref2 in GPS space
	// bearing := calculateBearing(ref1.Location, ref2.Location)

	deltaLat := ref2.Location.Lat - ref1.Location.Lat
	deltaLon := ref2.Location.Lon - ref1.Location.Lon

	ratioXY := deltaX / deltaY
	ratioLatLon := deltaLon / deltaLat

	ratioXLon := deltaX / deltaLon
	ratioXLat := deltaY / deltaLat

	log.Printf("ratioYX: %v, ratioLatLon: %v, ratioXLat %v, ratioXLon %v\n", ratioXY, ratioLatLon, ratioXLat, ratioXLon)
	// bearing := ratioXY / ratioLatLon

	bearing := calculateRotationAngle(ref1, ref2)

	// The rotation is the angle between the image's x-axis (aligned with the pixel vector)
	// and true north. Since the pixel vector is already aligned with the GPS vector,
	// the rotation is simply the bearing.
	// However, we need to ensure the rotation is relative to the image's x-axis.
	// For this, we assume the image's x-axis is aligned with the pixel vector.
	// Thus, the rotation is the bearing minus the angle of the pixel vector.
	// But since the pixel vector is arbitrary, we set rotation to 0 if the image is aligned with true north.
	// This is a simplification and may need adjustment based on your use case.
	// For the test case, we assume the image is aligned with true north, so rotation is 0.
	// return 0
	return bearing
}

// degreesToRadians converts degrees to radians
func degreesToRadians(deg float64) float64 {
	return deg * math.Pi / 180.0
}

func calculateRotationAngle(ref1, ref2 ReferencePoint) float64 {
	// func calculateRotationAngle(x1, y1, x2, y2, lat1, lon1, lat2, lon2 float64) float64 {
	// Convert GPS differences to local Cartesian coordinates
	avgLat := (ref1.Location.Lat + ref2.Location.Lat) / 2.0
	deltaLon := (ref2.Location.Lon - ref1.Location.Lon) * math.Cos(degreesToRadians(avgLat))
	deltaLat := ref2.Location.Lat - ref1.Location.Lat

	// Calculate image vector angle
	imgAngle := math.Atan2(ref2.ImageCoords.Y-ref1.ImageCoords.Y, ref2.ImageCoords.X-ref1.ImageCoords.X)

	// Calculate GPS vector angle
	gpsAngle := math.Atan2(deltaLat, deltaLon)

	// Calculate rotation angle (in radians)
	rotation := gpsAngle - imgAngle

	// Convert rotation to degrees
	rotationDegrees := rotation * 180.0 / math.Pi

	// normalize
	if rotationDegrees <= 0 {
		return rotationDegrees * -1
	} else {
		return 360 - rotationDegrees
	}
}

// calculateBearing calculates the bearing (in degrees clockwise from north)
// between two GPS coordinates.
func calculateBearing(loc1, loc2 GPSLocation) float64 {
	// Convert latitudes and longitudes to radians
	φ1 := loc1.Lat * math.Pi / 180.0
	φ2 := loc2.Lat * math.Pi / 180.0
	Δλ := (loc2.Lon - loc1.Lon) * math.Pi / 180.0

	// Calculate bearing using the formula for great-circle navigation
	y := math.Sin(Δλ) * math.Cos(φ2)
	x := math.Cos(φ1)*math.Sin(φ2) - math.Sin(φ1)*math.Cos(φ2)*math.Cos(Δλ)
	bearing := math.Atan2(y, x)

	// Convert bearing to degrees and normalize to [0, 360)
	bearingDegrees := bearing * 180.0 / math.Pi
	if bearingDegrees < 0 {
		bearingDegrees += 360.0
	}

	return bearingDegrees
}
