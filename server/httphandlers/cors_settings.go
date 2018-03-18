package httphandlers

import "github.com/go-chi/cors"

var CorsSettings = cors.New(cors.Options{
	// AllowedOrigins: []string{"https://foo.com"}, // Use this to allow specific origin hosts
	AllowedOrigins: []string{"*"},
	// AllowOriginFunc:  func(r *http.Request, origin string) bool { return true },
	AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
	AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
	ExposedHeaders:   []string{"Link"},
	AllowCredentials: true,
	MaxAge:           300, // Maximum value not ignored by any of major browsers
}).Handler
