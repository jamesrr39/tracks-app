package openapix

import (
	"context"
	"fmt"
	"net/http"
	"strings"

	"github.com/swaggest/openapi-go"
	"github.com/swaggest/rest/nethttp"
	"github.com/swaggest/usecase"
)

type OpenapiHandlerFunc[Req any, Resp any] func(ctx context.Context, input *Req, output *Resp) error

type HandlerSecurity struct {
	SecurityName string
	Scopes       []string
}

type HandlerOptions struct {
	Tags     []string
	Security *HandlerSecurity
}

// MustCreateOpenapiEndpoint creates an openapi endpoint. It panics on error.
func MustCreateOpenapiEndpoint[Req any, Resp any](title string, opts *HandlerOptions, handler OpenapiHandlerFunc[Req, Resp]) *nethttp.Handler {
	// prevent panic on nil accesses later
	if opts == nil {
		opts = new(HandlerOptions)
	}

	handlerDoc := usecase.IOInteractor{}

	if strings.TrimSpace(title) == "" {
		panic(fmt.Sprintf("title must be non-blank: %q", title))
	}

	if strings.TrimSpace(title) != title {
		panic(fmt.Sprintf("title must not start or end with whitespace: %q", title))
	}

	name := createEndpointName(title)

	handlerDoc.SetTitle(title)
	handlerDoc.SetName(name)
	handlerDoc.SetTags(opts.Tags...)

	var handlerOptions []func(*nethttp.Handler)

	if opts.Security != nil {
		securityHandlerOption := nethttp.AnnotateOpenAPIOperation(func(oc openapi.OperationContext) error {
			oc.AddSecurity(opts.Security.SecurityName, opts.Security.Scopes...)
			return nil
		})
		handlerOptions = append(handlerOptions, securityHandlerOption)
	}

	handlerDoc.Input = new(Req)
	handlerDoc.Output = new(Resp)

	handlerDoc.Interactor = usecase.NewInteractor[*Req, Resp](
		func(ctx context.Context, input *Req, output *Resp) error {
			return handler(ctx, input, output)
		})

	return nethttp.NewHandler(handlerDoc, handlerOptions...)
}

// createEndpointName generates an openapi "name" from a given "title"
// e.g. "Get All Users" -> "getAllUsers"
func createEndpointName(title string) string {
	var nameFragments []string
	for idx, titleFragment := range strings.Split(title, " ") {
		if strings.TrimSpace(titleFragment) == "" {
			continue
		}

		var nameFragment string
		if idx == 0 {
			nameFragment = strings.ToLower(string(titleFragment[0])) + titleFragment[1:]
		} else {
			nameFragment = strings.ToUpper(string(titleFragment[0])) + titleFragment[1:]
		}

		if nameFragment == "ID" {
			nameFragment = "Id"
		}

		nameFragments = append(nameFragments, nameFragment)
	}

	return strings.Join(nameFragments, "")
}

// router can satisfied by chi.Router
type router interface {
	Method(method string, pattern string, h http.Handler)
}

// convience methods for setting up endpoints

func Get(r router, path string, handler *nethttp.Handler) {
	r.Method(http.MethodGet, path, handler)
}
func Head(r router, path string, handler *nethttp.Handler) {
	r.Method(http.MethodHead, path, handler)
}
func Post(r router, path string, handler *nethttp.Handler) {
	r.Method(http.MethodPost, path, handler)
}
func Put(r router, path string, handler *nethttp.Handler) {
	r.Method(http.MethodPut, path, handler)
}
func Patch(r router, path string, handler *nethttp.Handler) {
	r.Method(http.MethodPatch, path, handler)
}
func Delete(r router, path string, handler *nethttp.Handler) {
	r.Method(http.MethodDelete, path, handler)
}
func Connect(r router, path string, handler *nethttp.Handler) {
	r.Method(http.MethodConnect, path, handler)
}
func Options(r router, path string, handler *nethttp.Handler) {
	r.Method(http.MethodOptions, path, handler)
}
func Trace(r router, path string, handler *nethttp.Handler) {
	r.Method(http.MethodTrace, path, handler)
}
