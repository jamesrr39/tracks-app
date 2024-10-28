package dal

import (
	"testing"
	"time"

	"github.com/jamesrr39/tracks-app/server/domain"
	"github.com/stretchr/testify/assert"
)

func Test_rebuildCache_and_getAll(t *testing.T) {
	var fitFileSummaries []*domain.GeoFileSummary
	fitFileSummaries = append(fitFileSummaries,
		domain.NewGeoFileSummary("a", "a", domain.GeoFileTypeFIT, "hash_abc", time.Date(2001, 01, 01, 01, 01, 01, 01, time.UTC), time.Date(2002, 01, 01, 01, 01, 01, 01, time.UTC), "my product", 1000, nil),
		domain.NewGeoFileSummary("b", "b", domain.GeoFileTypeFIT, "hash_def", time.Date(2001, 02, 01, 01, 01, 01, 01, time.UTC), time.Date(2002, 02, 01, 01, 01, 01, 01, time.UTC), "my product", 1000, nil),
		domain.NewGeoFileSummary("c", "c", domain.GeoFileTypeFIT, "hash_ghi", time.Date(2001, 03, 01, 01, 01, 01, 01, time.UTC), time.Date(2002, 03, 01, 01, 01, 01, 01, time.UTC), "my product", 1000, nil))
	cache := newFitCache(fitFileSummaries)

	retrievedSummaries := cache.getAll()
	assert.Len(t, retrievedSummaries, 3)
}
