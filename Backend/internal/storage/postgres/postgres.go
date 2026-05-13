package postgres

import (
	"context"
	"crypto/sha256"
	"database/sql"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
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

	db, err := sql.Open("postgres", cfg.Storage_path)

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

	fmt.Println("Alias:", alias)
	fmt.Println("expires:", expiresAt)
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
		b[i] = chars[time.Now().UnixNano()%int64(len(chars))]
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

	err := s.Db.QueryRow(`
		SELECT long_url
		FROM urls
		WHERE short_code = $1
	`, shortCode).Scan(&longUrl)

	if err != nil {
		return "", err
	}

	return longUrl, nil
}

func (s *Postgres) DeleteUrl(urlId string, userId string) (bool, error) {

	fmt.Println(urlId, userId)

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

	fmt.Println(rowsAffected)

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

func (s *Postgres) CheckIfUnique(ipHash string) (bool, error) {

	query := `
		SELECT id
		FROM clicks
		WHERE ip_hash = $1
		LIMIT 1
	`

	ctx := context.Background()

	var id int64

	err := s.Db.QueryRowContext(ctx, query, ipHash).Scan(&id)

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

	isUnique, err2 := s.CheckIfUnique(ipHash)

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
	fmt.Println("Saved Event Successfully")

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
