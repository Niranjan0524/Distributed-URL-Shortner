package storage

import "time"

type UrlResponse struct {
	ShortURL  string     `json:"shortUrl"`
	LongURL   string     `json:"longUrl"`
	CreatedAt time.Time  `json:"createdAt"`
	ExpiresAt *time.Time `json:"expiresAt,omitempty"`
}
type Storage interface {
	ShortenUrl(longUrl string, alias *string, expiresAt *time.Time, userId *string) (string, error)
	GetAllUrlData(userId string) ([]UrlResponse, error)
}
