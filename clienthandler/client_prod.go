// +build prod

package clienthandler

import "net/http"

func GetClientHandler() http.Handler {
	return http.FileServer(assetFS())
}
