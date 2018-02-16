// +build !prod

package httphandlers

import "net/http"

func NewClientHandler() http.Handler {
	return http.FileServer(http.Dir("client-bak"))
}
