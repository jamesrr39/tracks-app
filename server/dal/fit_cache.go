package dal

import (
	"os"
	"sync"

	"github.com/jamesrr39/tracks-app/server/domain"
)

type cacheMapType map[domain.Hash]*domain.GeoFileSummary

// fitFileSummaryCache maintains a cache of fit file properties
type fitFileSummaryCache struct {
	cacheMap            cacheMapType
	cacheByRelativePath map[string]*domain.GeoFileSummary
	mu                  sync.RWMutex
}

func newFitCache(fitFileSummaries []*domain.GeoFileSummary) *fitFileSummaryCache {
	cache := &fitFileSummaryCache{
		mu: sync.RWMutex{},
	}

	cache.rebuildCache(fitFileSummaries)

	return cache
}

func (c *fitFileSummaryCache) rebuildCache(fitFileSummaries []*domain.GeoFileSummary) {
	newByHashMap := make(cacheMapType)
	newByRelativePathMap := make(map[string]*domain.GeoFileSummary)

	for _, summary := range fitFileSummaries {
		newByHashMap[summary.Hash] = summary
		newByRelativePathMap[summary.RelativeFilePath] = summary
	}
	c.mu.Lock()
	c.cacheMap = newByHashMap
	c.cacheByRelativePath = newByRelativePathMap
	c.mu.Unlock()
}

func (c *fitFileSummaryCache) getAll() []*domain.GeoFileSummary {
	fitFileSummaries := []*domain.GeoFileSummary{}
	c.mu.RLock()
	defer c.mu.RUnlock()
	for _, v := range c.cacheMap {
		fitFileSummaries = append(fitFileSummaries, v)
	}
	return fitFileSummaries
}

// os.ErrNotExist if not present
func (c *fitFileSummaryCache) GetByRelativePath(relativePath string) (*domain.GeoFileSummary, error) {
	c.mu.RLock()
	defer c.mu.RUnlock()

	summary, ok := c.cacheByRelativePath[relativePath]
	if !ok {
		return nil, os.ErrNotExist
	}

	return summary, nil
}
