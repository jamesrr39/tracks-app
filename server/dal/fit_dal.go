package dal

import (
	"errors"
	"log"
	"os"
	"path/filepath"
	"strings"

	"github.com/jamesrr39/go-tracks-app/server/domain"
	"github.com/jamesrr39/goutil/dirtraversal"
	"github.com/jezard/fit"
	"github.com/spf13/afero"
)

// FitDAL represents an object that can scan for and parse .fit files
type FitDAL struct {
	fs      afero.Fs
	rootDir string
}

// NewFitDAL creates a FitDAL with a normal OS Filesystem (not for testing)
func NewFitDAL(rootDir string) *FitDAL {
	return &FitDAL{fs: afero.NewOsFs(), rootDir: rootDir}
}

// GetAll gets all the tracks under the given DAL root directory
func (d *FitDAL) GetAll() ([]*domain.FitFileSummary, error) {
	var fitFiles []*domain.FitFileSummary

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

		fitFiles = append(fitFiles, domain.NewFitFileSummary(fileInfo.Name()))

		return nil
	})

	if nil != err {
		return nil, err
	}

	return fitFiles, nil
}

// Get gets a parsed fit file
func (d *FitDAL) Get(relativeFilePath string) (*fit.FitFile, error) {
	if dirtraversal.IsTryingToTraverseUp(relativeFilePath) {
		return nil, errors.New("../ not allowed in filepath")
	}
	log.Printf("dal parsing fit file at: %s\n", filepath.Join(d.rootDir, relativeFilePath))
	fitFile := fit.Parse(filepath.Join(d.rootDir, relativeFilePath), false)
	return &fitFile, nil
}
