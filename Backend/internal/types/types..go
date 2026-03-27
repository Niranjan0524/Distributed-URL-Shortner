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
	Id        int64     `json:"id"`
	UrlId     int64     `json:"urlId" validate:"required"`
	ClickedAt time.Time `json:"clickedAt"`
	IpAddress *string   `json:"ipAddress,omitempty"`
	UserAgent *string   `json:"userAgent,omitempty"`
}

type CreateUrlRequest struct {
	LongUrl   string     `json:"longUrl" validate:"required,url"`
	Alias     *string    `json:"alias"`
	ExpiresAt *time.Time `json:"expiresAt,omitempty"`
	UserId    *string    `json:"userId" validate:"required"`
}
