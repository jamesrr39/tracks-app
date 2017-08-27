package dal

import (
	"testing"
	"time"

	"github.com/jamesrr39/go-tracks-app/server/domain"
	"github.com/stretchr/testify/assert"
)

func Test_rebuildCache_and_getAll(t *testing.T) {
	var fitFileSummaries []*domain.FitFileSummary
	fitFileSummaries = append(fitFileSummaries,
		domain.NewFitFileSummary("a", "hash_abc", time.Date(2001, 01, 01, 01, 01, 01, 01, time.UTC), time.Date(2002, 01, 01, 01, 01, 01, 01, time.UTC), "my corp", "my product", 1000),
		domain.NewFitFileSummary("b", "hash_def", time.Date(2001, 02, 01, 01, 01, 01, 01, time.UTC), time.Date(2002, 02, 01, 01, 01, 01, 01, time.UTC), "my corp", "my product", 1000),
		domain.NewFitFileSummary("c", "hash_ghi", time.Date(2001, 03, 01, 01, 01, 01, 01, time.UTC), time.Date(2002, 03, 01, 01, 01, 01, 01, time.UTC), "my corp", "my product", 1000))
	cache := newFitCache()
	cache.rebuildCache(fitFileSummaries)

	retrievedSummaries := cache.getAll()
	assert.Len(t, retrievedSummaries, 3)
}
