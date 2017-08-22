package domain

// FitFileSummary is a summary of a fit file
type FitFileSummary struct {
	Name string `json:"name"`
}

// NewFitFileSummary creates a new FitFileSummary
func NewFitFileSummary(name string) *FitFileSummary {
	return &FitFileSummary{Name: name}
}
