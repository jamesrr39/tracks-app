//go:build !prod
// +build !prod

package httphandlers

import (
	"net/http"

	"github.com/jamesrr39/goutil/httpextra"
)

func NewClientHandler() http.Handler {
	h, err := httpextra.NewLocalDevServerProxy()
	if err != nil {
		panic(err)
	}

	return h
}
