package domain

type ActivityBounds struct {
	LatMin  float64 `json:"latMin"`  // between -90 (south pole) and +90 (north pole)
	LatMax  float64 `json:"latMax"`  // between -90 (south pole) and +90 (north pole)
	LongMin float64 `json:"longMin"` // between -180 and +180
	LongMax float64 `json:"longMax"` // between -180 and +180
}
