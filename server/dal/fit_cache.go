package dal

import (
	"os"
	"sync"

	"github.com/jamesrr39/tracks-app/server/domain"
)

type cacheMapType map[domain.Hash]*domain.FitFileSummary

// fitFileSummaryCache maintains a cache of fit file properties
type fitFileSummaryCache struct {
	cacheMap            cacheMapType
	cacheByRelativePath map[string]*domain.FitFileSummary
	mu                  sync.RWMutex
}

func newFitCache(fitFileSummaries []*domain.FitFileSummary) *fitFileSummaryCache {
	cache := &fitFileSummaryCache{
		mu: sync.RWMutex{},
	}

	cache.rebuildCache(fitFileSummaries)

	return cache
}

func (c *fitFileSummaryCache) rebuildCache(fitFileSummaries []*domain.FitFileSummary) {
	newByHashMap := make(cacheMapType)
	newByRelativePathMap := make(map[string]*domain.FitFileSummary)

	for _, summary := range fitFileSummaries {
		newByHashMap[summary.Hash] = summary
		newByRelativePathMap[summary.Name] = summary
	}
	c.mu.Lock()
	c.cacheMap = newByHashMap
	c.cacheByRelativePath = newByRelativePathMap
	c.mu.Unlock()
}

func (c *fitFileSummaryCache) getAll() []*domain.FitFileSummary {
	fitFileSummaries := []*domain.FitFileSummary{}
	c.mu.RLock()
	defer c.mu.RUnlock()
	for _, v := range c.cacheMap {
		fitFileSummaries = append(fitFileSummaries, v)
	}
	return fitFileSummaries
}

// os.ErrNotExist if not present
func (c *fitFileSummaryCache) GetByRelativePath(relativePath string) (*domain.FitFileSummary, error) {
	c.mu.RLock()
	defer c.mu.RUnlock()

	summary, ok := c.cacheByRelativePath[relativePath]
	if !ok {
		return nil, os.ErrNotExist
	}

	return summary, nil
}
