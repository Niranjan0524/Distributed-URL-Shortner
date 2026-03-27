package urls

import (
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"net/http"

	"github.com/Niranjan0524/backend/internal/storage"
	"github.com/Niranjan0524/backend/internal/types"
	"github.com/Niranjan0524/backend/internal/utils/responses"
)

func HealthCheck() http.HandlerFunc {

	return func(res http.ResponseWriter, req *http.Request) {
		slog.Info("Helth check successfull")
		slog.Info("System up")
		res.Write([]byte("All ok"))
	}
}

func GetShortLink(storage storage.Storage) http.HandlerFunc {

	return func(res http.ResponseWriter, req *http.Request) {

		slog.Info("Received the url info")
		fmt.Println("URL data", req.Body)

		if req.Body == nil {
			responses.WriteJson(res, http.StatusBadRequest, responses.GeneralError(errors.New("Body is required")))
			return
		}

		var urlRequest types.CreateUrlRequest

		errs := json.NewDecoder(req.Body).Decode(&urlRequest)

		if errs != nil {
			responses.WriteJson(res, http.StatusInternalServerError, responses.GeneralError(errs))
			return
		}

		shortUrl, err := storage.ShortenUrl(urlRequest.LongUrl, urlRequest.Alias, urlRequest.ExpiresAt, urlRequest.UserId)

		if err != nil {
			responses.WriteJson(res, http.StatusInternalServerError, responses.GeneralError(err))
		}

		responses.WriteJson(res, http.StatusCreated, shortUrl)
	}
}
