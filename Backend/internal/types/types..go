package types

import "time"

type Url struct {
	Id        int64      `json:"id"`
	ShortCode string     `json:"shortCode" validate:"required"`
	LongUrl   string     `json:"longUrl" validate:"required,url"`
	UserId    *string    `json:"userId,omitempty"`
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

type CreateUrlRequest struct {
	LongUrl   string  `json:"longUrl" validate:"required,url"`
	Alias     *string `json:"alias"`
	ExpiresAt string  `json:"expiresAt,omitempty"`
	UserId    *string `json:"userId" validate:"required"`
}
