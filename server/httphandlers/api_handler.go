package httphandlers

import (
	"net/http"

	"github.com/go-chi/chi"
	"github.com/jamesrr39/tracks-app/server/dal"
)

type ApiHandler struct {
	http.Handler
}

func NewApiHandler(fitDAL *dal.FitDAL) *ApiHandler {

	fitHandler := NewFitHandler(fitDAL)

	router := chi.NewRouter()

	router.Use(CorsSettings)

	router.Mount("/tracks/", http.StripPrefix("/tracks", fitHandler))
	// apiHandler.PathPrefix("/tracks/").Handler(http.StripPrefix("/tracks", fitHandler))

	return &ApiHandler{router}
}
