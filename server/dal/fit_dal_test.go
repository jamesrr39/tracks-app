package dal

import (
	"testing"

	"github.com/spf13/afero"
	"github.com/stretchr/testify/assert"
)

func Test_RebuildCachesFromRootDir_and_GetAllSummariesInCache(t *testing.T) {
	fitDAL := &FitDAL{fs: &afero.MemMapFs{}, rootDir: "/activities", summaryCache: newFitCache(), cachesDir: "/caches"}

	file, err := fitDAL.fs.Create("/activities/a.fit")
	assert.Nil(t, err)
	defer file.Close()

	err = fitDAL.RebuildCachesFromRootDir()
	assert.Nil(t, err)

	fitFileSummaries := fitDAL.GetAllSummariesInCache()
	assert.Len(t, fitFileSummaries, 1)

}
