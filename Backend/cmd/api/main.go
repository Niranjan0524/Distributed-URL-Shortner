package main

import (
	"context"
	"fmt"
	"log"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/Niranjan0524/backend/geo"
	"github.com/Niranjan0524/backend/internal/auth"
	"github.com/Niranjan0524/backend/internal/config"
	"github.com/Niranjan0524/backend/internal/http/handler/urls"
	"github.com/Niranjan0524/backend/internal/storage/postgres"
	"github.com/gorilla/handlers"
	"github.com/joho/godotenv"
	"github.com/redis/go-redis/v9"
)

func main() {

	rdb := redis.NewClient((&redis.Options{Addr: "localhost:6379"}))

	ctx := context.Background()

	rdbErr := rdb.Set(ctx, "test", "hello redis", 0).Err()
	if rdbErr != nil {
		panic(rdbErr)
	}

	someValue, valErr := rdb.Get(ctx, "parth").Result()

	if valErr != nil {
		panic(valErr)
	}

	fmt.Println("From redis cache memory", someValue)

	err := godotenv.Load(".env")
	if err != nil {
		log.Println("No .env file found")
	}

	slog.Info("Welcome to main func")

	cfg := config.MustLoad()

	fmt.Println(cfg)

	if err := geo.InitGeoDB(); err != nil {
		slog.Warn("GeoIP database unavailable", "error", err)
	}

	//database

	storage, err := postgres.New(cfg)
	if err != nil {
		log.Fatal(err)
	}

	//router
	router := http.NewServeMux()

	cors := handlers.CORS(
		handlers.AllowedOrigins(allowedOrigins()),
		handlers.AllowedMethods([]string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}),
		handlers.AllowedHeaders([]string{"Content-Type", "Authorization"}),
	)

	router.HandleFunc("GET /health", urls.HealthCheck())
	router.HandleFunc("POST /api/shortenUrl", auth.VerifyUser(urls.GetShortLink(storage)))
	router.HandleFunc("GET /api/urls/recent", auth.VerifyUser(urls.GetRecentUrls(storage)))
	router.HandleFunc("GET /api/dashboard/urls", auth.VerifyUser(urls.GetDashboardUrls(storage)))
	router.HandleFunc("GET /api/analytics/summary", auth.VerifyUser(urls.GetAnalyticsSummary(storage)))
	router.HandleFunc("GET /api/analytics/clicks-over-time", auth.VerifyUser(urls.GetAnalyticsClicksOverTime(storage)))
	router.HandleFunc("GET /api/analytics/referrers", auth.VerifyUser(urls.GetAnalyticsReferrers(storage)))
	router.HandleFunc("GET /api/analytics/links", auth.VerifyUser(urls.GetAnalyticsUrls(storage)))
	router.HandleFunc("GET /api/analytics/urls/{urlId}", auth.VerifyUser(urls.GetUrlAnalytics(storage)))
	router.HandleFunc("GET /{shortCode}", urls.RedirectHandler(storage, rdb))
	router.HandleFunc("DELETE /removeUrl/{urlId}", auth.VerifyUser(urls.DeleteUrlWithId(storage)))

	//server

	server := http.Server{
		Addr:    cfg.Addr,
		Handler: cors(router),
	}

	slog.Info("Server Started")

	//to gracefully shut down the server we can use go routines(bec the ongoing req must finish sucessfully)
	done := make(chan os.Signal, 1)

	signal.Notify(done, os.Interrupt, syscall.SIGINT, syscall.SIGTERM)
	go func() {
		if err := server.ListenAndServe(); err != nil {
			slog.Info("shutting down the server")
		}
	}()

	<-done

	slog.Info("shutting down the server")

	// server.Shutdown() this will shutdown the server gracefully but cna infinitely hang

	//to limit the shutdown time:
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)

	defer cancel()

	if err := server.Shutdown(ctx); err != nil {
		slog.Error("Failed to shutdown")
	}

	slog.Info("server shutdown successfully")

}

func allowedOrigins() []string {
	origins := []string{"http://localhost:5173"}

	for _, envName := range []string{"FRONTEND_URL", "FRONTEND_URLS"} {
		raw := os.Getenv(envName)
		if raw == "" {
			continue
		}

		for _, origin := range strings.Split(raw, ",") {
			origin = strings.TrimSpace(origin)
			origin = strings.TrimRight(origin, "/")

			if origin != "" {
				origins = append(origins, origin)
			}
		}
	}

	return origins
}
