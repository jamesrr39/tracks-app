package dal

import (
	"encoding/gob"
	"io"
	"log/slog"
	"os"
	"path/filepath"
	"strings"
	"sync"

	"github.com/jamesrr39/go-errorsx"
	"github.com/jamesrr39/goutil/dirtraversal"
	"github.com/jamesrr39/tracks-app/server/domain"
	"github.com/spf13/afero"
	"github.com/tkrajina/gpxgo/gpx"
	"github.com/tormoder/fit"
)

// FitDAL represents an object that can scan for and parse .fit files
type FitDAL struct {
	fs                   afero.Fs
	rootDir              string
	summaryCache         *fitFileSummaryCache
	cachesDir            string
	nearbyObjectsFetcher domain.NearbyObjectsFetcher
}

// NewFitDALAndScan creates a FitDAL with a normal OS Filesystem (not for testing)
// and scans the rootDir to build up an 'inventory' of fit files
func NewFitDALAndScan(rootDir, cachesDir string, nearbyObjectsFetcher domain.NearbyObjectsFetcher) (*FitDAL, error) {
	fitDAL := &FitDAL{fs: afero.NewOsFs(), rootDir: rootDir, summaryCache: newFitCache(nil), cachesDir: cachesDir, nearbyObjectsFetcher: nearbyObjectsFetcher}
	err := fitDAL.RebuildCachesFromRootDir()
	if nil != err {
		return nil, err
	}

	return fitDAL, nil
}

// GetAllSummariesInCache gets all the tracks currently in the cache
// To rebuild the cache, call ScanRootDir
func (d *FitDAL) GetAllSummariesInCache() []*domain.GeoFileSummary {
	return d.summaryCache.getAll()
}

// RebuildCachesFromRootDir rebuilds the cache from the rootDir
func (d *FitDAL) RebuildCachesFromRootDir() error {
	fitFileSummaries := []*domain.GeoFileSummary{}
	var wg sync.WaitGroup
	var mu sync.Mutex

	processFuncMap := getProcessFuncMap()

	err := afero.Walk(d.fs, d.rootDir, func(path string, fileInfo os.FileInfo, err error) error {
		if nil != err {
			return err
		}

		if fileInfo.IsDir() {
			return nil
		}

		suffix := filepath.Ext(fileInfo.Name())
		processFuncMethods, ok := processFuncMap[suffix]
		if !ok {
			// no processing function, skip this file
			return nil
		}

		wg.Add(1)
		go func() {
			defer wg.Done()
			slog.Info("processing file", "path", path)

			file, hash, err := d.openFile(path)
			if nil != err {
				slog.Error("couldn't open GeoFile", "path", path, "Error", err)
				return
			}
			defer file.Close()

			relativeFilePath := strings.TrimPrefix(path, d.rootDir)
			relativeFilePath = strings.TrimPrefix(relativeFilePath, string(filepath.Separator))

			fitFileSummary, err := processFuncMethods.ParseSummary(relativeFilePath, hash, file)
			if nil != err {
				slog.Error("couldn't parse summary of GeoFile", "path", path, "Error", err)
				return
			}
			mu.Lock()
			fitFileSummaries = append(fitFileSummaries, fitFileSummary)
			mu.Unlock()
		}()

		return nil
	})

	if nil != err {
		return err
	}
	wg.Wait()
	d.summaryCache.rebuildCache(fitFileSummaries)

	for _, fitFileSummary := range fitFileSummaries {
		err := d.persistFitFileSummary(fitFileSummary.Hash, fitFileSummary)
		if nil != err {
			return err
		}
	}

	return nil
}

func (d *FitDAL) openFile(path string) (afero.File, domain.Hash, errorsx.Error) {
	file, err := d.fs.Open(path)
	if nil != err {
		return nil, "", errorsx.Wrap(err)
	}

	hash, err := domain.NewHash(file)
	if nil != err {
		return nil, "", errorsx.Wrap(err)
	}

	_, err = file.Seek(0, io.SeekStart)
	if nil != err {
		return nil, "", errorsx.Wrap(err)
	}

	return file, hash, nil

}

// map[file extension]process func
type processFuncMapType map[string](domain.FileParser)

func getProcessFuncMap() processFuncMapType {
	return processFuncMapType{
		".fit": domain.FitParser{},
		".gpx": domain.GpxParser{},
	}
}

func (d *FitDAL) GetRecords(relativeFilePath string) ([]*domain.Record, errorsx.Error) {
	if dirtraversal.IsTryingToTraverseUp(relativeFilePath) {
		return nil, errorsx.Errorf("../ not allowed in filepath")
	}

	procFuncMap := getProcessFuncMap()

	fileExt := filepath.Ext(relativeFilePath)

	procFuncMethods, ok := procFuncMap[fileExt]
	if !ok {
		return nil, errorsx.Errorf("unknown file extension: %s", fileExt)
	}

	filePath := filepath.Join(d.rootDir, relativeFilePath)

	file, _, err := d.openFile(filePath)
	if err != nil {
		return nil, errorsx.Wrap(err)
	}
	defer file.Close()

	records, err := procFuncMethods.ParseRecords(file)
	if err != nil {
		return nil, errorsx.Wrap(err)
	}

	return records, nil
}

// Get gets a parsed fit file. Returns os.ErrNotExist if file not found
func (d *FitDAL) GetSummary(relativeFilePath string) (*domain.GeoFileSummary, errorsx.Error) {
	if dirtraversal.IsTryingToTraverseUp(relativeFilePath) {
		return nil, errorsx.Errorf("../ not allowed in filepath")
	}

	// filepath.Join(d.rootDir,
	summary, err := d.summaryCache.GetByRelativePath(relativeFilePath)
	if err != nil {
		return nil, errorsx.Wrap(err, "relativeFilePath", relativeFilePath)
	}

	return summary, nil
}

func (d *FitDAL) persistFitFileSummary(hash domain.Hash, fitFile *domain.GeoFileSummary) error {
	filePath := filepath.Join(d.cachesDir, string(hash))
	_, err := d.fs.Stat(filePath)
	if nil != err {
		if os.IsNotExist(err) {
			// cache file already exists, do nothing
			return nil
		}
		return err
	}

	file, err := d.fs.Create(filePath)
	if nil != err {
		return err
	}
	defer file.Close()

	err = gob.NewEncoder(file).Encode(fitFile)
	if nil != err {
		return err
	}

	return nil
}

func (d *FitDAL) GetParsedGPXFile(relativeFilePath string) (*gpx.GPX, errorsx.Error) {
	if dirtraversal.IsTryingToTraverseUp(relativeFilePath) {
		return nil, errorsx.Errorf("../ not allowed in filepath")
	}

	if filepath.Ext(relativeFilePath) != ".gpx" {
		return nil, errorsx.Errorf("file path didn't end in .gpx, unable to parse as GPX file")
	}

	filePath := filepath.Join(d.rootDir, relativeFilePath)

	file, err := d.fs.Open(filePath)
	if err != nil {
		return nil, errorsx.Wrap(err)
	}
	defer file.Close()

	gpxFile, err := gpx.Parse(file)
	if err != nil {
		return nil, errorsx.Wrap(err)
	}

	return gpxFile, nil
}
func (d *FitDAL) GetParsedFitFile(relativeFilePath string) (*fit.File, errorsx.Error) {
	if dirtraversal.IsTryingToTraverseUp(relativeFilePath) {
		return nil, errorsx.Errorf("../ not allowed in filepath")
	}

	if filepath.Ext(relativeFilePath) != ".fit" {
		return nil, errorsx.Errorf("file path didn't end in .fit, unable to parse as FIT file")
	}

	filePath := filepath.Join(d.rootDir, relativeFilePath)

	file, err := d.fs.Open(filePath)
	if err != nil {
		return nil, errorsx.Wrap(err)
	}
	defer file.Close()

	fitFile, err := fit.Decode(file)
	if err != nil {
		return nil, errorsx.Wrap(err)
	}

	return fitFile, nil
}

func (d *FitDAL) GetRawFile(relativeFilePath string) (io.ReadCloser, errorsx.Error) {
	if dirtraversal.IsTryingToTraverseUp(relativeFilePath) {
		return nil, errorsx.Errorf("../ not allowed in filepath")
	}

	_, err := d.summaryCache.GetByRelativePath(relativeFilePath)
	if err != nil {
		return nil, errorsx.Wrap(err)
	}

	f, err := d.fs.Open(filepath.Join(d.rootDir, relativeFilePath))
	return f, errorsx.Wrap(err)
}
