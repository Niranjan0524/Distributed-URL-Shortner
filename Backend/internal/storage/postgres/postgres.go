package postgres

import (
	"database/sql"
	"log/slog"
	"time"

	"github.com/Niranjan0524/backend/internal/config"
	"github.com/Niranjan0524/backend/internal/storage"
	_ "github.com/lib/pq"
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

	_, er := db.Exec(`CREATE TABLE IF NOT EXISTS clicks (
    id BIGSERIAL PRIMARY KEY,
    url_id BIGINT REFERENCES urls(id) ON DELETE CASCADE,
    clicked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address TEXT,
    user_agent TEXT
)`)

	if er != nil {
		slog.Error(er.Error())
		return nil, er
	}

	return &Postgres{
		Db: db,
	}, nil
}

func (s *Postgres) ShortenUrl(longUrl string, alias *string, expiresAt *time.Time, userId *string) (string, error) {
	shortCode := ""

	if alias != nil && *alias != "" {
		shortCode = *alias
	} else {
		shortCode = generateShortCode(7)
	}

	query := `
		INSERT INTO urls (short_code , long_url,user_id,expires_at)
		VALUES ($1,$2,$3,$4)
		RETURNING short_code
	`

	err := s.Db.QueryRow(query, shortCode, longUrl, userId, expiresAt).Scan(&shortCode)

	if err != nil {
		return "", err
	}

	return shortCode, nil

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
        SELECT short_code, long_url, created_at, expires_at
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
