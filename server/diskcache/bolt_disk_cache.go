package diskcache

import (
	"time"

	"github.com/boltdb/bolt"
)

type Conn struct {
	*bolt.DB
}

func NewConn(path string) (*Conn, error) {
	db, err := bolt.Open(path, 0600, &bolt.Options{Timeout: time.Second * 3})
	if nil != err {
		return nil, err
	}

	return &Conn{db}, nil
}
