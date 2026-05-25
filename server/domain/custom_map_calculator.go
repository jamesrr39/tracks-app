package domain

import (
	"image"
	"log/slog"
	"math"

	"github.com/paulmach/orb/geo"
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
	xyBearingFromRef1To2Rads := math.Atan2(ref2.ImageCoords.Y-ref1.ImageCoords.Y, ref2.ImageCoords.X-ref1.ImageCoords.X)
	xyBearingFromRef1To2Deg := radiansToDegrees(xyBearingFromRef1To2Rads) + 90 // +90 as modelled on a ref1 to the west of ref2. But do we need to handle other use cases?
	// TODO

	// deltaLat := ref2.Location.Lat - ref1.Location.Lat
	// deltaLon := ref2.Location.Lon - ref1.Location.Lon
	// latLonBearingFromRef1To2Rads := math.Atan2(deltaLat, deltaLon)
	// latLonBearingFromRef1To2Deg := radiansToDegrees(latLonBearingFromRef1To2Rads)
	latLonBearingFromRef1To2Deg := haversineBearing(ref1.Location, ref2.Location)

	rotation := xyBearingFromRef1To2Deg - latLonBearingFromRef1To2Deg

	slog.Info("calculating rotation",
		"xyBearingFromRef1To2Deg", xyBearingFromRef1To2Deg,
		"latLonBearingFromRef1To2Deg", latLonBearingFromRef1To2Deg,
		// "deltaLat", deltaLat,
		// "deltaLon", deltaLon,
		"ref1", ref1.Location,
		"ref2", ref2.Location,
		"rotation", rotation)

	if rotation < 0 {
		rotation += 360
	}
	return rotation
}

// degreesToRadians converts degrees to radians
func degreesToRadians(deg float64) float64 {
	return deg * math.Pi / 180.0
}
func radiansToDegrees(rad float64) float64 {
	return rad * 180.0 / math.Pi
}

// haversineBearing calculates the bearing between two GPS points in degrees.
func haversineBearing(start, end GPSLocation) float64 {
	// lat1 := start.Lat * math.Pi / 180
	// lon1 := start.Lon * math.Pi / 180
	// lat2 := end.Lat * math.Pi / 180
	// lon2 := end.Lon * math.Pi / 180

	// dLon := lon2 - lon1

	// y := math.Sin(dLon) * math.Cos(lat2)
	// x := math.Cos(lat1)*math.Sin(lat2) - math.Sin(lat1)*math.Cos(lat2)*math.Cos(dLon)

	// bearingRads := math.Atan2(y, x)
	// bearing := radiansToDegrees(bearingRads)

	return geo.Bearing([2]float64{start.Lon, start.Lat}, [2]float64{end.Lon, end.Lat})
}

// imageBearing calculates the bearing between two points in image space in degrees.
func imageBearing(start, end Point) float64 {
	dx := end.X - start.X
	dy := end.Y - start.Y
	return math.Atan2(dy, dx) * 180 / math.Pi
}

// calculateRotation returns the degrees clockwise to rotate the image to align with GPS North.
func calculateRotation(p1, p2 ReferencePoint) float64 {
	// Calculate the bearing in GPS space (true north)
	gpsBearing := haversineBearing(p1.Location, p2.Location)

	// Calculate the bearing in image space
	imageBearing := imageBearing(p1.ImageCoords, p2.ImageCoords)

	// The rotation needed is the difference between the two bearings
	rotation := gpsBearing - imageBearing

	// Normalize to -180 to 180
	for rotation < -180 {
		rotation += 360
	}
	for rotation > 180 {
		rotation -= 360
	}

	return rotation
}

func calculateRotationAngle(ref1, ref2 ReferencePoint) float64 {
	// func calculateRotationAngle(x1, y1, x2, y2, lat1, lon1, lat2, lon2 float64) float64 {
	// Convert GPS differences to local Cartesian coordinates
	avgLat := (ref1.Location.Lat + ref2.Location.Lat) / 2.0
	deltaLon := (ref2.Location.Lon - ref1.Location.Lon) * math.Cos(degreesToRadians(avgLat))
	deltaLat := ref2.Location.Lat - ref1.Location.Lat

	// Calculate image vector angle
	imgAngle := math.Atan2(ref2.ImageCoords.Y-ref1.ImageCoords.Y, ref2.ImageCoords.X-ref1.ImageCoords.X)

	deltaLatMetric := deltaLat * 111320 // Approximate conversion from degrees to meters
	deltaLonMetric := deltaLon * 111320 * math.Cos(degreesToRadians(avgLat))

	// Calculate GPS vector angle
	gpsAngleDeg := radiansToDegrees(math.Atan2(deltaLatMetric, deltaLonMetric))

	// Calculate rotation angle (in radians)

	imgAngleDeg := radiansToDegrees(imgAngle)

	rotationDiff := gpsAngleDeg / imgAngleDeg
	// rotationDiff := gpsAngleDeg - imgAngleDeg

	// Convert rotation to degrees
	// rotationDegrees := (rotationDiff) * 180.0 / math.Pi
	rotationDegrees := rotationDiff
	ratioXY := ref2.ImageCoords.X - ref1.ImageCoords.X/(ref2.ImageCoords.Y-ref1.ImageCoords.Y)
	ratioLatLon := deltaLonMetric / deltaLatMetric

	slog.Info("calculateImageRotation",
		"deltaLatMetric", deltaLatMetric,
		"deltaLonMetric", deltaLonMetric,
		"gpsAngle", gpsAngleDeg,
		"imgAngle", imgAngleDeg,
		"rotationDiff", rotationDiff,
		"rotationDegrees", rotationDegrees,
		"ratioXY", ratioXY,
		"ratioLatLon", ratioLatLon,
		"xPixelsPerMetre", (ref2.ImageCoords.X-ref1.ImageCoords.X)/deltaLonMetric,
		"yPixelsPerMetre", (ref2.ImageCoords.Y-ref1.ImageCoords.Y)/deltaLatMetric,
	)

	// normalize
	// if rotationDegrees <= 0 {
	// 	return rotationDegrees * -1
	// } else {
	// 	return 360 - rotationDegrees
	// }
	return rotationDegrees
}
