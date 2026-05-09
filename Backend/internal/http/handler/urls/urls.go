package urls

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"net/http"

	"github.com/Niranjan0524/backend/internal/auth"
	"github.com/Niranjan0524/backend/internal/storage"
	"github.com/Niranjan0524/backend/internal/types"
	"github.com/Niranjan0524/backend/internal/utils/futureTime"
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

		if req.Body == nil {
			responses.WriteJson(res, http.StatusBadRequest, responses.GeneralError(errors.New("Body is required")))
			return
		}

		var urlRequest types.CreateUrlRequest

		errs := json.NewDecoder(req.Body).Decode(&urlRequest)

		fmt.Println("URL DATA: ", urlRequest.LongUrl, urlRequest.Alias, urlRequest.ExpiresAt)

		if urlRequest.LongUrl == "" || urlRequest.Alias == nil || urlRequest.ExpiresAt == "" {
			responses.WriteJson(res, http.StatusBadRequest, "Not Enough Details")
			return
		}

		if errors.Is(errs, io.EOF) {
			// empty body
			responses.WriteJson(res, http.StatusBadRequest, responses.GeneralError(errors.New("Body is required")))
			return
		}

		fmt.Println(errs)
		if errs != nil {
			responses.WriteJson(res, http.StatusBadRequest, "Not Enough Resources")
			return
		}

		expiresAt, timeError := futureTime.FindFutureTime(urlRequest.ExpiresAt)

		if timeError != nil {
			responses.WriteJson(res, http.StatusInternalServerError, responses.GeneralError(timeError))
		}

		userId := req.Context().Value(auth.UserIDKey)
		userIdValue, ok := userId.(string)

		if !ok || userId == "" {
			responses.WriteJson(res, http.StatusUnauthorized, responses.GeneralError(errors.New("user id not found")))
			return
		}

		//handle url,alias,expires at format
		shortUrl, err := storage.ShortenUrl(urlRequest.LongUrl, urlRequest.Alias, expiresAt, &userIdValue)

		if err != nil {
			responses.WriteJson(res, http.StatusInternalServerError, responses.GeneralError(err))
		}

		responses.WriteJson(res, http.StatusCreated, shortUrl)
	}
}

func GetPastUrls(storage storage.Storage) http.HandlerFunc {

	return func(res http.ResponseWriter, req *http.Request) {
		userId := req.Context().Value(auth.UserIDKey)

		userIdValue, ok := userId.(string)

		if !ok || userId == "" {
			responses.WriteJson(res, http.StatusUnauthorized, responses.GeneralError(errors.New("user id not found")))
			return
		}

		data, err := storage.GetAllUrlData(userIdValue)

		if err != nil {
			responses.WriteJson(res, http.StatusInternalServerError, err)
		}

		responses.WriteJson(res, http.StatusOK, data)
	}
}
