package urls

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"time"

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

		fmt.Println("URL DATA: ", urlRequest.LongUrl)

		if urlRequest.LongUrl == "" {
			responses.WriteJson(res, http.StatusBadRequest, "Not Enough Details")
			return
		}

		if errors.Is(errs, io.EOF) {
			// empty body
			responses.WriteJson(res, http.StatusBadRequest, responses.GeneralError(errors.New("Body is required")))
			return
		}

		if errs != nil {
			responses.WriteJson(res, http.StatusBadRequest, "Not Enough Resources")
			return
		}

		var expiresAt *time.Time
		if urlRequest.ExpiresAt != "" {
			var timeError error
			expiresAt, timeError = futureTime.FindFutureTime(urlRequest.ExpiresAt)
			if timeError != nil {
				responses.WriteJson(res, http.StatusBadRequest, responses.GeneralError(timeError))
				return
			}
		}

		userId := req.Context().Value(auth.UserIDKey)
		userIdValue, ok := userId.(string)

		if !ok || userId == "" {
			responses.WriteJson(res, http.StatusUnauthorized, responses.GeneralError(errors.New("user id not found")))
			return
		}

		fmt.Println("long", urlRequest.LongUrl)
		fmt.Println("alias", urlRequest.Alias)
		fmt.Println("expiresAt", urlRequest.ExpiresAt)

		//handle url,alias,expires at format
		urlObj, err := storage.ShortenUrl(urlRequest.LongUrl, urlRequest.Alias, expiresAt, &userIdValue)

		if err != nil {
			responses.WriteJson(res, http.StatusInternalServerError, responses.GeneralError(err))
			return
		}

		responses.WriteJson(res, http.StatusCreated, urlObj)
	}
}

func GetRecentUrls(storage storage.Storage) http.HandlerFunc {

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

func RedirectHandler(storage storage.Storage) http.HandlerFunc {

	return func(res http.ResponseWriter, req *http.Request) {

		shortCode := req.PathValue("shortCode")

		if shortCode == "" {
			responses.WriteJson(res, http.StatusBadRequest, "ShortCode Not Received")
		}

		longUrl, err := storage.GetLongUrl(shortCode)

		if err != nil {
			if err.Error() == "URL Expired" {

				html := `
				<!DOCTYPE html>
				<html>
				<head>
					<title>Link Expired</title>
					<style>
						body {
							font-family: Arial;
							text-align: center;
							padding-top: 100px;
						}
					</style>
				</head>
				<body>
					<h1>410 - Link Expired</h1>
					<p>This short URL has expired.</p>
				</body>
				</html>
				`

				responses.WriteHTML(res, http.StatusGone, html)
				return
			}
			html := `
				<!DOCTYPE html>
				<html>
				<head>
					<title>Not Found</title>
					<style>
						body {
							font-family: Arial;
							text-align: center;
							padding-top: 100px;
						}
					</style>
				</head>
				<body>
					<h1>404 - URL Not Found</h1>
					<p>The requested short URL does not exist.</p>
				</body>
				</html>
				`

			responses.WriteHTML(res, http.StatusNotFound, html)
			return
		}

		go storage.SaveAnalytics(req)

		http.Redirect(res, req, longUrl, http.StatusFound)
	}
}

func DeleteUrlWithId(storage storage.Storage) http.HandlerFunc {

	return func(res http.ResponseWriter, req *http.Request) {
		userId := req.Context().Value(auth.UserIDKey)

		userIdValue, ok := userId.(string)

		if !ok || userId == "" {
			responses.WriteJson(res, http.StatusUnauthorized, responses.GeneralError(errors.New("user id not found")))
			return
		}
		urlId := req.PathValue("urlId")
		fmt.Println("urlId in fun:", urlId)

		if urlId == "" {
			responses.WriteJson(res, http.StatusBadRequest, "Url Not Found")
		}

		_, err := storage.DeleteUrl(urlId, userIdValue)

		if err != nil {
			fmt.Println(err)
			responses.WriteJson(res, http.StatusInternalServerError, "Delete Action Aborted")
		}

		responses.WriteJson(res, http.StatusAccepted, "Url Deleted")
	}
}

func GetAnalyticsUrls(storage storage.Storage) http.HandlerFunc {

	return func(res http.ResponseWriter, req *http.Request) {
		userIdValue, ok := authenticatedUserId(res, req)
		if !ok {
			return
		}

		data, err := storage.GetAnalyticsLinks(userIdValue, analyticsRange(req))
		if err != nil {
			responses.WriteJson(res, http.StatusInternalServerError, responses.GeneralError(err))
			return
		}

		responses.WriteJson(res, http.StatusOK, data)
	}
}

func authenticatedUserId(res http.ResponseWriter, req *http.Request) (string, bool) {
	userId := req.Context().Value(auth.UserIDKey)
	userIdValue, ok := userId.(string)

	if !ok || userId == "" {
		responses.WriteJson(res, http.StatusUnauthorized, responses.GeneralError(errors.New("user id not found")))
		return "", false
	}

	return userIdValue, true
}

func analyticsRange(req *http.Request) string {
	rangeName := req.URL.Query().Get("range")
	switch rangeName {
	case "30d", "90d", "all":
		return rangeName
	default:
		return "7d"
	}
}

func GetAnalyticsSummary(storage storage.Storage) http.HandlerFunc {
	return func(res http.ResponseWriter, req *http.Request) {
		userIdValue, ok := authenticatedUserId(res, req)
		if !ok {
			return
		}

		data, err := storage.GetAnalyticsSummary(userIdValue, analyticsRange(req))
		if err != nil {
			responses.WriteJson(res, http.StatusInternalServerError, responses.GeneralError(err))
			return
		}

		responses.WriteJson(res, http.StatusOK, data)
	}
}

func GetAnalyticsClicksOverTime(storage storage.Storage) http.HandlerFunc {
	return func(res http.ResponseWriter, req *http.Request) {
		userIdValue, ok := authenticatedUserId(res, req)
		if !ok {
			return
		}

		data, err := storage.GetAnalyticsClicksOverTime(userIdValue, analyticsRange(req))
		if err != nil {
			responses.WriteJson(res, http.StatusInternalServerError, responses.GeneralError(err))
			return
		}

		responses.WriteJson(res, http.StatusOK, data)
	}
}

func GetAnalyticsReferrers(storage storage.Storage) http.HandlerFunc {
	return func(res http.ResponseWriter, req *http.Request) {
		userIdValue, ok := authenticatedUserId(res, req)
		if !ok {
			return
		}

		data, err := storage.GetAnalyticsReferrers(userIdValue, analyticsRange(req), nil, 5)
		if err != nil {
			responses.WriteJson(res, http.StatusInternalServerError, responses.GeneralError(err))
			return
		}

		responses.WriteJson(res, http.StatusOK, data)
	}
}

func GetUrlAnalytics(storage storage.Storage) http.HandlerFunc {
	return func(res http.ResponseWriter, req *http.Request) {
		userIdValue, ok := authenticatedUserId(res, req)
		if !ok {
			return
		}

		urlId := req.PathValue("urlId")
		if urlId == "" {
			responses.WriteJson(res, http.StatusBadRequest, responses.GeneralError(errors.New("url id is required")))
			return
		}

		data, err := storage.GetUrlAnalytics(userIdValue, urlId, analyticsRange(req))
		if err != nil {
			responses.WriteJson(res, http.StatusInternalServerError, responses.GeneralError(err))
			return
		}

		responses.WriteJson(res, http.StatusOK, data)
	}
}

func GetDashboardUrls(storage storage.Storage) http.HandlerFunc {

	return func(res http.ResponseWriter, req *http.Request) {
		userId := req.Context().Value(auth.UserIDKey)

		userIdValue, ok := userId.(string)

		if !ok || userId == "" {
			responses.WriteJson(res, http.StatusUnauthorized, responses.GeneralError(errors.New("user id not found")))
			return
		}

		data, err := storage.GetDashboardData(userIdValue)

		if err != nil {
			responses.WriteJson(res, http.StatusInternalServerError, responses.GeneralError(err))
			return
		}

		responses.WriteJson(res, http.StatusOK, data)
	}
}
