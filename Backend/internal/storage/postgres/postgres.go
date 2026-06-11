package postgres

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"database/sql"
	"errors"
	"fmt"
	"log/slog"
	"math/big"
	"net/http"
	neturl "net/url"
	"strings"
	"time"

	"github.com/Niranjan0524/backend/geo"
	"github.com/Niranjan0524/backend/internal/config"
	"github.com/Niranjan0524/backend/internal/storage"
	_ "github.com/lib/pq"
	"github.com/mssola/user_agent"
)

type Postgres struct {
	Db *sql.DB
}

func New(cfg *config.Config) (*Postgres, error) {

	db, err := sql.Open("postgres", cfg.StoragePath)

	if err != nil {
		return nil, err
	}

	_, error := db.Exec(`CREATE TABLE IF NOT EXISTS urls (
		id BIGSERIAL PRIMARY KEY,
		short_code VARCHAR(20) UNIQUE NOT NULL,
		long_url TEXT NOT NULL,
		user_id UUID,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		expires_at TIMESTAMP
	)`)

	if error != nil {
		slog.Error(error.Error())
		return nil, error
	}

	_, er := db.Exec(`
		CREATE TABLE IF NOT EXISTS clicks (
			id BIGSERIAL PRIMARY KEY,

			url_id BIGINT NOT NULL
				REFERENCES urls(id)
				ON DELETE CASCADE,

			clicked_at TIMESTAMP NOT NULL
				DEFAULT CURRENT_TIMESTAMP,

			ip_hash TEXT,

			user_agent TEXT,

			referer TEXT,

			country TEXT,

			city TEXT,

			device_type TEXT,

			browser TEXT,

			os TEXT,

			is_unique BOOLEAN NOT NULL
				DEFAULT FALSE
		)
		`)

	if er != nil {
		slog.Error(er.Error())
		return nil, er
	}

	return &Postgres{
		Db: db,
	}, nil
}

func (s *Postgres) ShortenUrl(longUrl string, alias *string, expiresAt *time.Time, userId *string) (storage.UrlResponse, error) {
	shortCode := ""

	if alias != nil && strings.TrimSpace(*alias) != "" {
		shortCode = strings.TrimSpace(*alias)
	} else {
		shortCode = generateShortCode(7)
	}

	query := `
	INSERT INTO urls (short_code, long_url, user_id, expires_at)
	VALUES ($1, $2, $3, $4)
	RETURNING short_code, long_url, created_at, expires_at
	`

	var urlObj storage.UrlResponse

	err := s.Db.QueryRow(query, shortCode, longUrl, userId, expiresAt).
		Scan(&urlObj.ShortURL, &urlObj.LongURL, &urlObj.CreatedAt, &urlObj.ExpiresAt)

	if err != nil {
		return storage.UrlResponse{}, err
	}

	return urlObj, nil

}

func generateShortCode(length int) string {
	const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"

	b := make([]byte, length)
	for i := range b {
		n, _ := rand.Int(rand.Reader, big.NewInt(int64(len(chars))))
		b[i] = chars[n.Int64()]
	}
	return string(b)
}

func (s *Postgres) GetAllUrlData(userId string) ([]storage.UrlResponse, error) {

	rows, err := s.Db.Query(`
        SELECT id,short_code, long_url, created_at, expires_at
        FROM urls
        WHERE user_id = $1
        ORDER BY created_at DESC
    `, userId)

	if err != nil {
		return nil, err
	}
	defer rows.Close()

	urls := []storage.UrlResponse{}

	for rows.Next() {
		var item storage.UrlResponse

		err := rows.Scan(
			&item.Id,
			&item.ShortURL,
			&item.LongURL,
			&item.CreatedAt,
			&item.ExpiresAt,
		)
		if err != nil {
			return nil, err
		}

		urls = append(urls, item)
	}

	return urls, rows.Err()
}

func (s *Postgres) GetLongUrl(shortCode string) (string, error) {

	if shortCode == "" {
		return "", errors.New("ShortCode not Found")
	}

	var longUrl string
	var expiryTime *time.Time

	err := s.Db.QueryRow(`
		SELECT long_url,expires_at
		FROM urls
		WHERE short_code = $1
	`, shortCode).Scan(&longUrl, &expiryTime)

	if err != nil {
		fmt.Println("err in db", err)
		return "", err
	}

	if expiryTime != nil && time.Now().After(*expiryTime) {
		return "", errors.New("URL Expired")
	}

	return longUrl, nil
}

func (s *Postgres) DeleteUrl(urlId string, userId string) (bool, error) {

	query := `
		DELETE FROM urls
		WHERE user_id = $1
		AND id = $2
		`

	ctx := context.Background()

	res, err := s.Db.ExecContext(ctx, query, userId, urlId)

	rowsAffected, err := res.RowsAffected()
	if err != nil {
		return false, err
	}

	if rowsAffected == 0 {
		return false, errors.New("Url Not Found")
	}

	return true, nil
}
func GetClientIp(req *http.Request) string {
	ip := req.Header.Get("X-Forwarded-For")

	if ip == "" {
		ip = req.RemoteAddr
	}

	return ip
}

func HashIP(ip string) string {

	hash := sha256.Sum256([]byte(ip))

	return fmt.Sprintf("%x", hash)
}

func ParseUserAgent(userAgentString string) (*string, *string, *string) {

	ua := user_agent.New(userAgentString)

	browserName, _ := ua.Browser()

	os := ua.OS()

	deviceType := "Desktop"

	if ua.Mobile() {
		deviceType = "Mobile"
	}

	return &deviceType, &browserName, &os
}

func (s *Postgres) CheckIfUnique(urlId int, ipHash string) (bool, error) {

	query := `
		SELECT id
		FROM clicks
		WHERE url_id = $1
		AND ip_hash = $2
		LIMIT 1
	`

	ctx := context.Background()

	var id int64

	err := s.Db.QueryRowContext(ctx, query, urlId, ipHash).Scan(&id)

	if err != nil {

		if err == sql.ErrNoRows {
			return true, nil
		}

		return false, err
	}

	return false, nil
}

func (s *Postgres) SaveAnalytics(req *http.Request) {

	shortCode := req.PathValue("shortCode")
	query := `SELECT id From urls WHERE short_code=$1 `

	urlId := 0
	err := s.Db.QueryRow(query, shortCode).Scan(&urlId)

	if err != nil {
		fmt.Println("Error Finding urlId", err)
		return
	}

	clickedAt := time.Now()

	ip := GetClientIp(req)

	ipHash := HashIP(ip)

	ref := req.Referer()

	country, city := geo.GetLocation(ip)

	userAgent := req.UserAgent()
	device, browser, os := ParseUserAgent(userAgent)

	isUnique, err2 := s.CheckIfUnique(urlId, ipHash)

	if err2 != nil {
		fmt.Println("Error in unique check", err2)
	}

	insertQuery := `
		INSERT INTO clicks (
			url_id,
			clicked_at,
			ip_hash,
			user_agent,
			referer,
			country,
			city,
			device_type,
			browser,
			os,
			is_unique
		)
		VALUES (
			$1, $2, $3, $4, $5,
			$6, $7, $8, $9, $10,
			$11
		)
	`

	_, err = s.Db.Exec(
		insertQuery,
		urlId,
		clickedAt,
		ipHash,
		userAgent,
		ref,
		country,
		city,
		device,
		browser,
		os,
		isUnique,
	)

	if err != nil {
		fmt.Println("Error Saving Analytics:", err)
		return
	}

}

func (s *Postgres) GetDashboardData(userId string) ([]storage.DashboardUrls, error) {
	rows, err := s.Db.Query(`
		SELECT
			u.id,
			u.short_code,
			u.long_url,
			u.created_at,
			u.expires_at,
			COUNT(c.id) AS clicks
		FROM urls u
		LEFT JOIN clicks c ON c.url_id = u.id
		WHERE u.user_id = $1
		GROUP BY u.id, u.short_code, u.long_url, u.created_at, u.expires_at
		ORDER BY u.created_at DESC
	`, userId)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	urls := []storage.DashboardUrls{}

	for rows.Next() {
		var item storage.DashboardUrls

		err := rows.Scan(
			&item.Id,
			&item.ShortURL,
			&item.LongURL,
			&item.CreatedAt,
			&item.ExpiresAt,
			&item.Clicks,
		)
		if err != nil {
			return nil, err
		}

		urls = append(urls, item)
	}

	return urls, rows.Err()
}

func analyticsRangeStart(rangeName string) *time.Time {
	now := time.Now()

	switch strings.ToLower(strings.TrimSpace(rangeName)) {
	case "30d":
		start := now.AddDate(0, 0, -29)
		return &start
	case "90d":
		start := now.AddDate(0, 0, -89)
		return &start
	case "all":
		return nil
	default:
		start := now.AddDate(0, 0, -6)
		return &start
	}
}

func analyticsRangeDays(rangeName string) int {
	switch strings.ToLower(strings.TrimSpace(rangeName)) {
	case "30d":
		return 30
	case "90d":
		return 90
	default:
		return 7
	}
}

func scanAnalyticsLinks(rows *sql.Rows) ([]storage.AnalyticsLink, error) {
	links := []storage.AnalyticsLink{}

	for rows.Next() {
		var item storage.AnalyticsLink

		err := rows.Scan(
			&item.Id,
			&item.ShortURL,
			&item.LongURL,
			&item.CreatedAt,
			&item.ExpiresAt,
			&item.TotalClicks,
			&item.UniqueClicks,
			&item.LastClickedAt,
		)
		if err != nil {
			return nil, err
		}

		links = append(links, item)
	}

	return links, rows.Err()
}

func (s *Postgres) GetAnalyticsSummary(userId string, rangeName string) (storage.AnalyticsSummary, error) {
	start := analyticsRangeStart(rangeName)
	var summary storage.AnalyticsSummary

	err := s.Db.QueryRow(`
		SELECT
			COUNT(DISTINCT u.id) AS total_links,
			COUNT(c.id) AS total_clicks,
			COUNT(c.id) FILTER (WHERE c.is_unique) AS unique_clicks,
			COUNT(c.id) FILTER (WHERE c.clicked_at::date = CURRENT_DATE) AS clicks_today
		FROM urls u
		LEFT JOIN clicks c
			ON c.url_id = u.id
			AND ($2::timestamp IS NULL OR c.clicked_at >= $2)
		WHERE u.user_id = $1
	`, userId, start).Scan(
		&summary.TotalLinks,
		&summary.TotalClicks,
		&summary.UniqueClicks,
		&summary.ClicksToday,
	)
	if err != nil {
		return storage.AnalyticsSummary{}, err
	}

	if summary.TotalLinks > 0 {
		summary.AvgClicksPerLink = float64(summary.TotalClicks) / float64(summary.TotalLinks)
	}

	var topLinkId sql.NullInt64
	var topLinkSlug sql.NullString
	var topLinkClicks sql.NullInt64

	err = s.Db.QueryRow(`
		SELECT
			u.id,
			u.short_code,
			COUNT(c.id) AS clicks
		FROM urls u
		LEFT JOIN clicks c
			ON c.url_id = u.id
			AND ($2::timestamp IS NULL OR c.clicked_at >= $2)
		WHERE u.user_id = $1
		GROUP BY u.id, u.short_code
		ORDER BY clicks DESC, u.created_at DESC
		LIMIT 1
	`, userId, start).Scan(&topLinkId, &topLinkSlug, &topLinkClicks)
	if err != nil && err != sql.ErrNoRows {
		return storage.AnalyticsSummary{}, err
	}

	if topLinkId.Valid {
		id := int(topLinkId.Int64)
		summary.TopLinkId = &id
	}
	if topLinkSlug.Valid {
		summary.TopLinkSlug = topLinkSlug.String
	}
	if topLinkClicks.Valid {
		summary.TopLinkClicks = int(topLinkClicks.Int64)
	}

	return summary, nil
}

func (s *Postgres) GetAnalyticsLinks(userId string, rangeName string) ([]storage.AnalyticsLink, error) {
	start := analyticsRangeStart(rangeName)

	rows, err := s.Db.Query(`
		SELECT
			u.id,
			u.short_code,
			u.long_url,
			u.created_at,
			u.expires_at,
			COUNT(c.id) AS total_clicks,
			COUNT(c.id) FILTER (WHERE c.is_unique) AS unique_clicks,
			MAX(c.clicked_at) AS last_clicked_at
		FROM urls u
		LEFT JOIN clicks c
			ON c.url_id = u.id
			AND ($2::timestamp IS NULL OR c.clicked_at >= $2)
		WHERE u.user_id = $1
		GROUP BY u.id, u.short_code, u.long_url, u.created_at, u.expires_at
		ORDER BY total_clicks DESC, u.created_at DESC
	`, userId, start)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	return scanAnalyticsLinks(rows)
}

func (s *Postgres) GetAnalyticsClicksOverTime(userId string, rangeName string) ([]storage.ClicksOverTimePoint, error) {
	start := analyticsRangeStart(rangeName)
	points := []storage.ClicksOverTimePoint{}

	var rows *sql.Rows
	var err error

	if start == nil {
		rows, err = s.Db.Query(`
			SELECT
				DATE(c.clicked_at) AS click_date,
				COUNT(c.id) AS clicks,
				COUNT(c.id) FILTER (WHERE c.is_unique) AS unique_clicks
			FROM urls u
			JOIN clicks c ON c.url_id = u.id
			WHERE u.user_id = $1
			GROUP BY click_date
			ORDER BY click_date
		`, userId)
	} else {
		days := analyticsRangeDays(rangeName)
		rows, err = s.Db.Query(`
			WITH days AS (
				SELECT generate_series(
					CURRENT_DATE - (($2::int - 1) * INTERVAL '1 day'),
					CURRENT_DATE,
					INTERVAL '1 day'
				)::date AS day
			)
			SELECT
				d.day,
				COUNT(u.id) AS clicks,
				COUNT(u.id) FILTER (WHERE c.is_unique) AS unique_clicks
			FROM days d
			LEFT JOIN clicks c
				ON DATE(c.clicked_at) = d.day
			LEFT JOIN urls u
				ON u.id = c.url_id
				AND u.user_id = $1
			GROUP BY d.day
			ORDER BY d.day
		`, userId, days)
	}

	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var day time.Time
		var item storage.ClicksOverTimePoint

		if err := rows.Scan(&day, &item.Clicks, &item.UniqueClicks); err != nil {
			return nil, err
		}

		item.Date = day.Format("2006-01-02")
		item.Day = day.Format("Jan 2")
		points = append(points, item)
	}

	return points, rows.Err()
}

func referrerSource(raw string) string {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return "Direct"
	}

	parsed, err := neturl.Parse(raw)
	if err != nil || parsed.Hostname() == "" {
		return "Other"
	}

	host := strings.TrimPrefix(strings.ToLower(parsed.Hostname()), "www.")
	switch {
	case host == "t.co" || host == "x.com" || strings.HasSuffix(host, ".twitter.com") || strings.HasSuffix(host, ".x.com"):
		return "Twitter / X"
	case host == "linkedin.com" || strings.HasSuffix(host, ".linkedin.com"):
		return "LinkedIn"
	case host == "github.com" || strings.HasSuffix(host, ".github.com"):
		return "GitHub"
	default:
		return host
	}
}

func topReferrersFromRows(rows *sql.Rows, limit int) ([]storage.ReferrerStat, error) {
	counts := map[string]int{}
	total := 0

	for rows.Next() {
		var raw sql.NullString
		var clicks int

		if err := rows.Scan(&raw, &clicks); err != nil {
			return nil, err
		}

		source := "Direct"
		if raw.Valid {
			source = referrerSource(raw.String)
		}

		counts[source] += clicks
		total += clicks
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	stats := make([]storage.ReferrerStat, 0, len(counts))
	for source, clicks := range counts {
		percentage := 0
		if total > 0 {
			percentage = int(float64(clicks)/float64(total)*100 + 0.5)
		}
		stats = append(stats, storage.ReferrerStat{
			Source:     source,
			Clicks:     clicks,
			Percentage: percentage,
		})
	}

	for i := 0; i < len(stats); i++ {
		for j := i + 1; j < len(stats); j++ {
			if stats[j].Clicks > stats[i].Clicks {
				stats[i], stats[j] = stats[j], stats[i]
			}
		}
	}

	if limit > 0 && len(stats) > limit {
		otherClicks := 0
		for _, stat := range stats[limit-1:] {
			otherClicks += stat.Clicks
		}

		stats = stats[:limit-1]
		percentage := 0
		if total > 0 {
			percentage = int(float64(otherClicks)/float64(total)*100 + 0.5)
		}
		stats = append(stats, storage.ReferrerStat{
			Source:     "Other",
			Clicks:     otherClicks,
			Percentage: percentage,
		})
	}

	return stats, nil
}

func (s *Postgres) GetAnalyticsReferrers(userId string, rangeName string, urlId *string, limit int) ([]storage.ReferrerStat, error) {
	start := analyticsRangeStart(rangeName)

	rows, err := s.Db.Query(`
		SELECT c.referer, COUNT(c.id) AS clicks
		FROM urls u
		JOIN clicks c ON c.url_id = u.id
		WHERE u.user_id = $1
		AND ($2::timestamp IS NULL OR c.clicked_at >= $2)
		AND ($3::bigint IS NULL OR u.id = $3)
		GROUP BY c.referer
	`, userId, start, urlId)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	return topReferrersFromRows(rows, limit)
}

func (s *Postgres) getBreakdown(userId string, urlId string, rangeName string, column string, limit int) ([]storage.BreakdownStat, error) {
	start := analyticsRangeStart(rangeName)
	allowed := map[string]bool{
		"country":     true,
		"city":        true,
		"device_type": true,
		"browser":     true,
		"os":          true,
	}

	if !allowed[column] {
		return nil, fmt.Errorf("unsupported analytics breakdown: %s", column)
	}

	query := fmt.Sprintf(`
		SELECT COALESCE(NULLIF(c.%s, ''), 'Unknown') AS label, COUNT(c.id) AS clicks
		FROM urls u
		JOIN clicks c ON c.url_id = u.id
		WHERE u.user_id = $1
		AND u.id = $2
		AND ($3::timestamp IS NULL OR c.clicked_at >= $3)
		GROUP BY label
		ORDER BY clicks DESC
		LIMIT $4
	`, column)

	rows, err := s.Db.Query(query, userId, urlId, start, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	stats := []storage.BreakdownStat{}
	total := 0
	for rows.Next() {
		var item storage.BreakdownStat
		if err := rows.Scan(&item.Label, &item.Clicks); err != nil {
			return nil, err
		}
		total += item.Clicks
		stats = append(stats, item)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	for i := range stats {
		if total > 0 {
			stats[i].Percentage = int(float64(stats[i].Clicks)/float64(total)*100 + 0.5)
		}
	}

	return stats, nil
}

func (s *Postgres) GetUrlAnalytics(userId string, urlId string, rangeName string) (storage.UrlAnalyticsDetail, error) {
	start := analyticsRangeStart(rangeName)
	var detail storage.UrlAnalyticsDetail

	rows, err := s.Db.Query(`
		SELECT
			u.id,
			u.short_code,
			u.long_url,
			u.created_at,
			u.expires_at,
			COUNT(c.id) AS total_clicks,
			COUNT(c.id) FILTER (WHERE c.is_unique) AS unique_clicks,
			MAX(c.clicked_at) AS last_clicked_at
		FROM urls u
		LEFT JOIN clicks c
			ON c.url_id = u.id
			AND ($3::timestamp IS NULL OR c.clicked_at >= $3)
		WHERE u.user_id = $1
		AND u.id = $2
		GROUP BY u.id, u.short_code, u.long_url, u.created_at, u.expires_at
	`, userId, urlId, start)
	if err != nil {
		return storage.UrlAnalyticsDetail{}, err
	}
	links, err := scanAnalyticsLinks(rows)
	rows.Close()
	if err != nil {
		return storage.UrlAnalyticsDetail{}, err
	}
	if len(links) == 0 {
		return storage.UrlAnalyticsDetail{}, sql.ErrNoRows
	}

	detail.URL = links[0]
	detail.Summary = storage.AnalyticsSummary{
		TotalLinks:       1,
		TotalClicks:      detail.URL.TotalClicks,
		UniqueClicks:     detail.URL.UniqueClicks,
		AvgClicksPerLink: float64(detail.URL.TotalClicks),
		TopLinkId:        &detail.URL.Id,
		TopLinkSlug:      detail.URL.ShortURL,
		TopLinkClicks:    detail.URL.TotalClicks,
	}

	clickRows, err := s.Db.Query(`
		WITH days AS (
			SELECT generate_series(
				CURRENT_DATE - (($3::int - 1) * INTERVAL '1 day'),
				CURRENT_DATE,
				INTERVAL '1 day'
			)::date AS day
		)
		SELECT
			d.day,
			COUNT(c.id) AS clicks,
			COUNT(c.id) FILTER (WHERE c.is_unique) AS unique_clicks
		FROM days d
		LEFT JOIN clicks c
			ON DATE(c.clicked_at) = d.day
			AND c.url_id = $2
		LEFT JOIN urls u
			ON u.id = c.url_id
			AND u.user_id = $1
		GROUP BY d.day
		ORDER BY d.day
	`, userId, urlId, analyticsRangeDays(rangeName))
	if err != nil {
		return storage.UrlAnalyticsDetail{}, err
	}
	defer clickRows.Close()

	for clickRows.Next() {
		var day time.Time
		var item storage.ClicksOverTimePoint
		if err := clickRows.Scan(&day, &item.Clicks, &item.UniqueClicks); err != nil {
			return storage.UrlAnalyticsDetail{}, err
		}
		item.Date = day.Format("2006-01-02")
		item.Day = day.Format("Jan 2")
		detail.ClicksOverTime = append(detail.ClicksOverTime, item)
	}
	if err := clickRows.Err(); err != nil {
		return storage.UrlAnalyticsDetail{}, err
	}

	detail.Referrers, err = s.GetAnalyticsReferrers(userId, rangeName, &urlId, 5)
	if err != nil {
		return storage.UrlAnalyticsDetail{}, err
	}

	detail.Locations, err = s.getBreakdown(userId, urlId, rangeName, "country", 5)
	if err != nil {
		return storage.UrlAnalyticsDetail{}, err
	}

	detail.Devices, err = s.getBreakdown(userId, urlId, rangeName, "device_type", 5)
	if err != nil {
		return storage.UrlAnalyticsDetail{}, err
	}

	detail.Browsers, err = s.getBreakdown(userId, urlId, rangeName, "browser", 5)
	if err != nil {
		return storage.UrlAnalyticsDetail{}, err
	}

	detail.OperatingSystems, err = s.getBreakdown(userId, urlId, rangeName, "os", 5)
	if err != nil {
		return storage.UrlAnalyticsDetail{}, err
	}

	recentRows, err := s.Db.Query(`
		SELECT clicked_at, referer, country, city, device_type, browser, os, is_unique
		FROM clicks c
		JOIN urls u ON u.id = c.url_id
		WHERE u.user_id = $1
		AND u.id = $2
		AND ($3::timestamp IS NULL OR c.clicked_at >= $3)
		ORDER BY c.clicked_at DESC
		LIMIT 12
	`, userId, urlId, start)
	if err != nil {
		return storage.UrlAnalyticsDetail{}, err
	}
	defer recentRows.Close()

	for recentRows.Next() {
		var item storage.RecentClick
		if err := recentRows.Scan(
			&item.ClickedAt,
			&item.Referer,
			&item.Country,
			&item.City,
			&item.DeviceType,
			&item.Browser,
			&item.Os,
			&item.IsUnique,
		); err != nil {
			return storage.UrlAnalyticsDetail{}, err
		}
		detail.RecentClicks = append(detail.RecentClicks, item)
	}
	if err := recentRows.Err(); err != nil {
		return storage.UrlAnalyticsDetail{}, err
	}

	return detail, nil
}
