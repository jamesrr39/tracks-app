package dal

import (
	"testing"

	"github.com/spf13/afero"
	"github.com/stretchr/testify/require"
)

func Test_RebuildCachesFromRootDir_and_GetAllSummariesInCache(t *testing.T) {
	fs := afero.NewMemMapFs()
	err := fs.Mkdir("/activities", 0700)
	require.Nil(t, err)

	fitDAL := &FitDAL{fs: fs, rootDir: "/activities", summaryCache: newFitCache(), cachesDir: "/caches"}

	err = fitDAL.RebuildCachesFromRootDir()
	require.Nil(t, err)

	fitFileSummaries := fitDAL.GetAllSummariesInCache()
	require.Len(t, fitFileSummaries, 0)

}
