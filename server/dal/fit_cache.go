package dal

import (
	"sync"

	"github.com/jamesrr39/go-tracks-app/server/domain"
)

type cacheMap map[domain.Hash]*domain.FitFileSummary

// FitCache maintains a cache of fit file properties
type fitFileSummaryCache struct {
	cacheMap
	mu sync.Mutex
}

func newFitCache() *fitFileSummaryCache {
	return &fitFileSummaryCache{cacheMap: make(cacheMap), mu: sync.Mutex{}}
}

func (c *fitFileSummaryCache) rebuildCache(fitFileSummaries []*domain.FitFileSummary) {
	newMap := make(cacheMap)
	for _, summary := range fitFileSummaries {
		newMap[summary.Hash] = summary
	}
	c.mu.Lock()
	c.cacheMap = newMap
	c.mu.Unlock()
}

func (c *fitFileSummaryCache) getAll() []*domain.FitFileSummary {
	var fitFileSummaries []*domain.FitFileSummary
	c.mu.Lock()
	for _, v := range c.cacheMap {
		fitFileSummaries = append(fitFileSummaries, v)
	}
	c.mu.Unlock()
	return fitFileSummaries
}
