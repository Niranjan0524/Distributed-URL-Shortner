package urls

import (
	"log/slog"
	"net/http"
)

func HealthCheck() http.HandlerFunc {

	return func(res http.ResponseWriter, req *http.Request) {
		slog.Info("Helth check successfull")
		slog.Info("System up")
		res.Write([]byte("All ok"))
	}
}
