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

type DashboardUrls struct {
	Id        int        `json:"Id"`
	ShortURL  string     `json:"shortUrl"`
	LongURL   string     `json:"originalUrl"`
	CreatedAt time.Time  `json:"createdAt"`
	ExpiresAt *time.Time `json:"expiresAt,omitempty"`
	Clicks    int        `json:"clicks"`
}

type AnalyticsSummary struct {
	TotalLinks       int     `json:"totalLinks"`
	TotalClicks      int     `json:"totalClicks"`
	UniqueClicks     int     `json:"uniqueClicks"`
	AvgClicksPerLink float64 `json:"avgClicksPerLink"`
	TopLinkId        *int    `json:"topLinkId,omitempty"`
	TopLinkSlug      string  `json:"topLinkSlug"`
	TopLinkClicks    int     `json:"topLinkClicks"`
	ClicksToday      int     `json:"clicksToday"`
}

type AnalyticsLink struct {
	Id            int        `json:"id"`
	ShortURL      string     `json:"shortUrl"`
	LongURL       string     `json:"originalUrl"`
	CreatedAt     time.Time  `json:"createdAt"`
	ExpiresAt     *time.Time `json:"expiresAt,omitempty"`
	TotalClicks   int        `json:"totalClicks"`
	UniqueClicks  int        `json:"uniqueClicks"`
	LastClickedAt *time.Time `json:"lastClickedAt,omitempty"`
}

type ClicksOverTimePoint struct {
	Date         string `json:"date"`
	Day          string `json:"day"`
	Clicks       int    `json:"clicks"`
	UniqueClicks int    `json:"uniqueClicks"`
}

type ReferrerStat struct {
	Source     string `json:"source"`
	Clicks     int    `json:"clicks"`
	Percentage int    `json:"percentage"`
}

type BreakdownStat struct {
	Label      string `json:"label"`
	Clicks     int    `json:"clicks"`
	Percentage int    `json:"percentage"`
}

type RecentClick struct {
	ClickedAt  time.Time `json:"clickedAt"`
	Referer    *string   `json:"referer,omitempty"`
	Country    *string   `json:"country,omitempty"`
	City       *string   `json:"city,omitempty"`
	DeviceType *string   `json:"deviceType,omitempty"`
	Browser    *string   `json:"browser,omitempty"`
	Os         *string   `json:"os,omitempty"`
	IsUnique   bool      `json:"isUnique"`
}

type UrlAnalyticsDetail struct {
	URL              AnalyticsLink         `json:"url"`
	Summary          AnalyticsSummary      `json:"summary"`
	ClicksOverTime   []ClicksOverTimePoint `json:"clicksOverTime"`
	Referrers        []ReferrerStat        `json:"referrers"`
	Locations        []BreakdownStat       `json:"locations"`
	Devices          []BreakdownStat       `json:"devices"`
	Browsers         []BreakdownStat       `json:"browsers"`
	OperatingSystems []BreakdownStat       `json:"operatingSystems"`
	RecentClicks     []RecentClick         `json:"recentClicks"`
}

type Storage interface {
	ShortenUrl(longUrl string, alias *string, expiresAt *time.Time, userId *string) (UrlResponse, error)
	GetAllUrlData(userId string) ([]UrlResponse, error)
	GetLongUrl(shortCode string) (string, error)
	DeleteUrl(urlId string, userId string) (bool, error)
	SaveAnalytics(*http.Request)
	GetDashboardData(userId string) ([]DashboardUrls, error)
	GetAnalyticsSummary(userId string, rangeName string) (AnalyticsSummary, error)
	GetAnalyticsLinks(userId string, rangeName string) ([]AnalyticsLink, error)
	GetAnalyticsClicksOverTime(userId string, rangeName string) ([]ClicksOverTimePoint, error)
	GetAnalyticsReferrers(userId string, rangeName string, urlId *string, limit int) ([]ReferrerStat, error)
	GetUrlAnalytics(userId string, urlId string, rangeName string) (UrlAnalyticsDetail, error)
}
