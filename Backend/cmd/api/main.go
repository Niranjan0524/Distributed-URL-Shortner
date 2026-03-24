package main

import (
	"context"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/Niranjan0524/backend/internal/config"
	"github.com/Niranjan0524/backend/internal/http/handler/urls"
)

func main() {

	slog.Info("Welcome to main func")

	cfg := config.MustLoad()

	fmt.Println(cfg)

	//database

	//router
	router := http.NewServeMux()

	router.HandleFunc("GET /health", urls.HealthCheck())

	//server

	server := http.Server{
		Addr:    cfg.Addr,
		Handler: router,
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
