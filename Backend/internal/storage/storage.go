package storage

import (
	"net/http"
	"time"
)

type UrlResponse struct {
	Id        int        `json:"Id"`
	ShortURL  string     `json:"shortUrl"`
	LongURL   string     `json:"originalUrl"`
	CreatedAt time.Time  `json:"createdAt"`
	ExpiresAt *time.Time `json:"expiresAt,omitempty"`
}

type Click struct {
	Id         int64     `json:"id"`
	UrlId      int64     `json:"urlId" validate:"required"`
	ClickedAt  time.Time `json:"clickedAt"`
	IpHash     *string   `json:"ipHash,omitempty"`
	UserAgent  *string   `json:"userAgent,omitempty"`
	Referer    *string   `json:"referer,omitempty"`
	Country    *string   `json:"country,omitempty"`
	City       *string   `json:"city,omitempty"`
	DeviceType *string   `json:"deviceType,omitempty"`
	Browser    *string   `json:"browser,omitempty"`
	Os         *string   `json:"os,omitempty"`
	IsUnique   bool      `json:"isUnique"`
}
type Storage interface {
	ShortenUrl(longUrl string, alias *string, expiresAt *time.Time, userId *string) (UrlResponse, error)
	GetAllUrlData(userId string) ([]UrlResponse, error)
	GetLongUrl(shortCode string) (string, error)
	DeleteUrl(urlId string, userId string) (bool, error)
	SaveAnalytics(*http.Request)
}
