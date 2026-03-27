package storage

import "time"

type Storage interface {
	ShortenUrl(longUrl string, alias *string, expiresAt *time.Time, userId *string) (string, error)
}
