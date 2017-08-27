package domain

import (
	"crypto/sha512"
	"encoding/hex"
	"io"
)

type Hash string

func NewHash(reader io.Reader) (Hash, error) {
	hasher := sha512.New()
	_, err := io.Copy(hasher, reader)
	if nil != err {
		return "", err
	}

	return Hash(hex.EncodeToString(hasher.Sum(nil))), nil
}
