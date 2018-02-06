package dal

import (
	"bytes"
	"encoding/gob"
	"errors"
	"fmt"
	"io"
	"io/ioutil"
	"log"
	"os"
	"path/filepath"
	"strings"
	"sync"

	"github.com/jamesrr39/goutil/dirtraversal"
	"github.com/jamesrr39/tracks-app/server/domain"
	"github.com/spf13/afero"
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
	fitDAL := &FitDAL{fs: afero.NewOsFs(), rootDir: rootDir, summaryCache: newFitCache(), cachesDir: cachesDir, nearbyObjectsFetcher: nearbyObjectsFetcher}
	err := fitDAL.RebuildCachesFromRootDir()
	if nil != err {
		return nil, err
	}

	return fitDAL, nil
}

// GetAllSummariesInCache gets all the tracks currently in the cache
// To rebuild the cache, call ScanRootDir
func (d *FitDAL) GetAllSummariesInCache() []*domain.FitFileSummary {
	return d.summaryCache.getAll()
}

// RebuildCachesFromRootDir rebuilds the cache from the rootDir
func (d *FitDAL) RebuildCachesFromRootDir() error {
	var fitFileSummaries []*domain.FitFileSummary
	var wg sync.WaitGroup
	var mu sync.Mutex

	err := afero.Walk(d.fs, d.rootDir, func(path string, fileInfo os.FileInfo, err error) error {
		if nil != err {
			return err
		}

		if fileInfo.IsDir() {
			return nil
		}

		if !strings.HasSuffix(fileInfo.Name(), ".fit") {
			return nil
		}

		wg.Add(1)
		go func() {
			defer wg.Done()
			log.Printf("processing %s\n", path)

			fitFileSummary, err := d.processFitFile(path)
			if nil != err {
				log.Printf("ERROR: couldn't process FitFile: %s. Error: %s\n", path, err)
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

func (d *FitDAL) processFitFile(path string) (*domain.FitFileSummary, error) {

	file, err := d.fs.Open(path)
	if nil != err {
		return nil, err
	}
	defer file.Close()

	fileBytes, err := ioutil.ReadAll(file)
	if nil != err {
		return nil, fmt.Errorf("couldn't read '%s' into memory. Error: %s", path, err)
	}

	hash, err := domain.NewHash(bytes.NewBuffer(fileBytes))
	if nil != err {
		return nil, fmt.Errorf("couldn't generate a hash for %s. Error: %s", path, err)
	}

	fitFileSummary, err := d.readFromPersistedFile(hash)
	if nil != err {
		return nil, fmt.Errorf("error while reading from persisted path '%s'. Error: %s", path, err)
	}

	relativeFilePath := strings.TrimPrefix(strings.TrimPrefix(path, d.rootDir), string(filepath.Separator))
	log.Printf("relative file path: %s\n", relativeFilePath)
	if nil == fitFileSummary {
		fitFileSummary, err = domain.NewFitFileSummaryFromReader(relativeFilePath, hash, bytes.NewBuffer(fileBytes), d.nearbyObjectsFetcher)
		if nil != err {
			return nil, fmt.Errorf("couldn't generate a FitFileSummary for '%s'. Error: %s", path, err)
		}
	}

	return fitFileSummary, nil
}

// readFromPersistedFile reads a FitFileSummary from a gob-encoded pre-existing file
// it returns (nil, error) if there was an unexpected error
// (nil, nil) if no on-disk file was found (and no unexpected errors)
// (*domain.FitFileSummary, nil) if a file on-disk was found and read successfully
func (d *FitDAL) readFromPersistedFile(hash domain.Hash) (*domain.FitFileSummary, error) {
	pathToPersistedFile := filepath.Join(d.cachesDir, string(hash))

	persistedFile, err := d.fs.Open(pathToPersistedFile)
	if nil != err {
		if os.IsNotExist(err) {
			return nil, nil
		}
		return nil, err
	}
	defer persistedFile.Close()

	var fitFileSummary *domain.FitFileSummary

	err = gob.NewDecoder(persistedFile).Decode(&fitFileSummary)
	if nil != err {
		return nil, err
	}

	return fitFileSummary, nil
}

// Get gets a parsed fit file
func (d *FitDAL) Get(relativeFilePath string) (*domain.FitFile, error) {
	if dirtraversal.IsTryingToTraverseUp(relativeFilePath) {
		return nil, errors.New("../ not allowed in filepath")
	}

	filePath := filepath.Join(d.rootDir, relativeFilePath)
	log.Printf("dal parsing fit file at: %s\n", filePath)
	file, err := d.fs.Open(filePath)
	if nil != err {
		return nil, err
	}
	defer file.Close()

	fileBytes, err := ioutil.ReadAll(file)
	if nil != err {
		return nil, err
	}

	hash, err := domain.NewHash(bytes.NewBuffer(fileBytes))
	if nil != err {
		return nil, err
	}

	fitFile, err := domain.NewFitFile(relativeFilePath, hash, bytes.NewBuffer(fileBytes), d.nearbyObjectsFetcher)
	if nil != err {
		return nil, err
	}

	return fitFile, nil
}

func (d *FitDAL) persistFitFileSummary(hash domain.Hash, fitFile *domain.FitFileSummary) error {
	filePath := filepath.Join(d.cachesDir, string(hash))
	_, err := d.fs.Stat(filePath)
	if nil != err {
		if os.IsNotExist(err) {
			// cache file already exists, do nothing
			return nil
		}
		return err
	}

	buf := bytes.NewBuffer(nil)

	err = gob.NewEncoder(buf).Encode(fitFile)
	if nil != err {
		return err
	}

	file, err := d.fs.Create(filePath)
	if nil != err {
		return err
	}
	defer file.Close()

	_, err = io.Copy(file, buf)
	if nil != err {
		return err
	}

	return nil
}
