package storage

import "time"

type UrlResponse struct {
	ShortURL  string     `json:"shortUrl"`
	LongURL   string     `json:"originalUrl"`
	CreatedAt time.Time  `json:"createdAt"`
	ExpiresAt *time.Time `json:"expiresAt,omitempty"`
}
type Storage interface {
	ShortenUrl(longUrl string, alias *string, expiresAt *time.Time, userId *string) (UrlResponse, error)
	GetAllUrlData(userId string) ([]UrlResponse, error)
}
