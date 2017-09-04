// +build !prod

package clienthandler

import "net/http"

func GetClientHandler() http.Handler {
	return http.StripPrefix("/", http.FileServer(http.Dir("client")))
}
