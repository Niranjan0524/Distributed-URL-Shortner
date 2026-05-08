package main

import (
	"context"
	"fmt"
	"log"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/Niranjan0524/backend/internal/auth"
	"github.com/Niranjan0524/backend/internal/config"
	"github.com/Niranjan0524/backend/internal/http/handler/urls"
	"github.com/Niranjan0524/backend/internal/storage/postgres"
	"github.com/gorilla/handlers"
	"github.com/joho/godotenv"
)

func main() {

	err := godotenv.Load(".env")
	if err != nil {
		log.Println("No .env file found")
	}

	slog.Info("Welcome to main func")

	cfg := config.MustLoad()

	fmt.Println(cfg)

	//database

	storage, err := postgres.New(cfg)
	if err != nil {
		log.Fatal(err)
	}

	//router
	router := http.NewServeMux()

	frontendUrl, exists := os.LookupEnv("FRONTEND_URL")

	if !exists {
		frontendUrl = "http://localhost:5173"
	}

	cors := handlers.CORS(
		handlers.AllowedOrigins([]string{frontendUrl}),
		handlers.AllowedMethods([]string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}),
		handlers.AllowedHeaders([]string{"Content-Type", "Authorization"}),
	)

	router.HandleFunc("GET /health", urls.HealthCheck())
	router.HandleFunc("POST /api/shortenUrl", auth.VerifyUser(urls.GetShortLink(storage)))

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
