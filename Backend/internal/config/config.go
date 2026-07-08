package config

import (
	"flag"
	"fmt"
	"log"
	"os"
	"strings"

	"github.com/ilyakaznacheev/cleanenv"
)

type HttpServer struct {
	Addr string `yaml:"address" env:"ADDRESS" env-default:"localhost:8082"`
}

type Config struct {
	Env         string `yaml:"env" env:"ENV" env-default:"production"`
	StoragePath string `yaml:"storage_path" env:"DATABASE_URL" env-required:"true"`
	MongoURI    string `yaml:"mongo_uri" env:"MONGO_URI"`
	DBName      string `yaml:"db_name" env:"DB_NAME"`
	HttpServer  `yaml:"http_server"`
}

func MustLoad() *Config {
	var configPath string

	configPath = os.Getenv("CONFIG_PATH")

	if configPath == "" {
		flags := flag.String("config", "", "path to the configuration file")
		flag.Parse()

		configPath = *flags

		if configPath == "" {
			return mustLoadFromEnv()
		}
	}

	if _, err := os.Stat(configPath); os.IsNotExist(err) {
		log.Fatal("config file does not exist")
	}

	var cfg Config

	err := cleanenv.ReadConfig(configPath, &cfg)

	if err != nil {
		log.Fatal("Cannot read the config file", err.Error())
	}

	applyEnvOverrides(&cfg)

	return &cfg
}

func mustLoadFromEnv() *Config {
	var cfg Config

	if err := cleanenv.ReadEnv(&cfg); err != nil {
		log.Fatal("Cannot read environment config: ", err.Error())
	}

	applyEnvOverrides(&cfg)

	return &cfg
}

func applyEnvOverrides(cfg *Config) {
	if databaseURL := strings.TrimSpace(os.Getenv("DATABASE_URL")); databaseURL != "" {
		cfg.StoragePath = databaseURL
	}

	if storagePath := strings.TrimSpace(os.Getenv("STORAGE_PATH")); storagePath != "" {
		cfg.StoragePath = storagePath
	}

	if port := strings.TrimSpace(os.Getenv("PORT")); port != "" {
		cfg.Addr = fmt.Sprintf(":%s", port)
	}
}
