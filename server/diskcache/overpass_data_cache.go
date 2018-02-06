package diskcache

import (
	"bytes"
	"encoding/json"
	"log"
	"time"

	"github.com/jamesrr39/tracks-app/server/domain"
)

var overpassResponseBucketName = []byte("overpass_response")

type OverpassCacheEntry struct {
	Elements   []*domain.GeographicMapElement
	CachedTime time.Time
}

// GetOverpassResponse retrieves from the cache the elements for a given bounds if it was cached, nil if it has not yet been cached, or an error.
func GetOverpassData(conn *Conn, bounds *domain.ActivityBounds) (*OverpassCacheEntry, error) {
	tx, err := conn.Begin(false)
	if nil != err {
		return nil, err
	}
	defer tx.Rollback()

	key, err := encodeOverpassBounds(bounds)
	if nil != err {
		return nil, err
	}

	bucket := tx.Bucket(overpassResponseBucketName)
	if nil == bucket {
		// nothing cached yet
		return nil, nil
	}

	val := bucket.Get(key)
	if bytes.Equal([]byte(""), val) {
		// not cached
		return nil, nil
	}

	var overpassCacheEntry *OverpassCacheEntry
	err = json.NewDecoder(bytes.NewBuffer(val)).Decode(&overpassCacheEntry)
	if nil != err {
		return nil, err
	}

	return overpassCacheEntry, nil
}

func SetOverpassData(conn *Conn, bounds *domain.ActivityBounds, geographicMapElements []*domain.GeographicMapElement) error {
	var err error

	tx, err := conn.Begin(true)
	if nil != err {
		return err
	}

	defer func() {
		if nil != err {
			tx.Rollback()
		}
	}()

	key, err := encodeOverpassBounds(bounds)
	if nil != err {
		return err
	}

	overpassCacheEntry := &OverpassCacheEntry{
		Elements:   geographicMapElements,
		CachedTime: time.Now(),
	}

	bb := bytes.NewBuffer(nil)
	err = json.NewEncoder(bb).Encode(overpassCacheEntry)
	if nil != err {
		return err
	}

	bucket, err := tx.CreateBucketIfNotExists(overpassResponseBucketName)
	if nil != err {
		return err
	}

	err = bucket.Put(key, bb.Bytes())
	if nil != err {
		return err
	}

	log.Printf("set %s for %s\n", bb.Bytes(), key)

	return tx.Commit()
}

func encodeOverpassBounds(bounds *domain.ActivityBounds) ([]byte, error) {
	bb := bytes.NewBuffer(nil)
	err := json.NewEncoder(bb).Encode(bounds)
	if nil != err {
		return nil, err
	}

	return bb.Bytes(), nil
}
