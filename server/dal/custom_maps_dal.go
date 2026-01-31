package dal

import (
	"encoding/json"
	"image"
	_ "image/gif"
	_ "image/jpeg"
	_ "image/png"
	"io"
	"io/fs"
	"log/slog"
	"os"
	"path/filepath"
	"strings"

	"github.com/jamesrr39/go-errorsx"
	"github.com/jamesrr39/tracks-app/server/domain"
)

type CustomMapsDAL struct {
	basePath string
	Maps     []domain.CustomMapMetadata
}

func NewCustomMapsDALAndScan(basePath string) (*CustomMapsDAL, errorsx.Error) {
	d := &CustomMapsDAL{basePath: basePath, Maps: []domain.CustomMapMetadata{}}

	err := filepath.Walk(basePath, func(path string, info fs.FileInfo, err error) error {
		if err != nil {
			return errorsx.Wrap(err, "path", path)
		}

		if !strings.HasSuffix(path, domain.CustomMapMetadataFileSuffix) {
			slog.Info("custom maps: skipping", "path", path)
			return nil
		}

		file, err := os.Open(path)
		if err != nil {
			return errorsx.Wrap(err, "path", path)
		}
		defer file.Close()

		name := path
		name = strings.TrimPrefix(name, basePath)
		name = strings.TrimPrefix(name, string(filepath.Separator))
		name = strings.TrimSuffix(name, domain.CustomMapMetadataFileSuffix)

		metadata := domain.CustomMapMetadata{
			Name: name,
		}
		err = json.NewDecoder(file).Decode(&metadata)
		if err != nil {
			return errorsx.Wrap(err, "path", path)
		}

		imgFilePath := filepath.Join(basePath, name)
		imgFile, err := os.Open(imgFilePath)
		if err != nil {
			return errorsx.Wrap(err, "imgFilePath", imgFilePath)
		}
		defer imgFile.Close()

		img, _, err := image.Decode(imgFile)
		if err != nil {
			return errorsx.Wrap(err, "imgFilePath", imgFilePath)
		}

		metadata.Bounds = metadata.CalculateMapBounds(img.Bounds())

		d.Maps = append(d.Maps, metadata)
		return nil
	})
	if err != nil {
		return nil, errorsx.Wrap(err)
	}

	return d, nil
}

// GetByPath returns os.ErrNotExist is not found
func (m *CustomMapsDAL) GetByName(name string) (domain.CustomMapMetadata, error) {
	for _, item := range m.Maps {
		if item.Name == name {
			return item, nil
		}
	}

	return domain.CustomMapMetadata{}, os.ErrNotExist
}

func (m *CustomMapsDAL) GetFile(name string) (io.ReadCloser, error) {
	// check in list
	_, err := m.GetByName(name)
	if err != nil {
		return nil, err
	}

	filePath := filepath.Join(m.basePath, name)
	f, err := os.Open(filePath)
	if err != nil {
		return nil, errorsx.Wrap(err)
	}
	return f, nil
}
