package mongo

import (
	"context"
	"crypto/rand"
	"errors"
	"math/big"
	"strconv"
	"strings"
	"time"

	"github.com/Niranjan0524/backend/internal/config"
	"github.com/Niranjan0524/backend/internal/storage"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

type Mongo struct {
	Client *mongo.Client
	DB     *mongo.Database
}

type urlDocument struct {
	Id        int        `bson:"id"`
	ShortURL  string     `bson:"short_code"`
	LongURL   string     `bson:"long_url"`
	UserId    *string    `bson:"user_id,omitempty"`
	CreatedAt time.Time  `bson:"created_at"`
	ExpiresAt *time.Time `bson:"expires_at,omitempty"`
}

type clickDocument struct {
	Id         int64     `bson:"id"`
	UrlId      int       `bson:"url_id"`
	ClickedAt  time.Time `bson:"clicked_at"`
	IpHash     *string   `bson:"ip_hash,omitempty"`
	UserAgent  *string   `bson:"user_agent,omitempty"`
	Referer    *string   `bson:"referer,omitempty"`
	Country    *string   `bson:"country,omitempty"`
	City       *string   `bson:"city,omitempty"`
	DeviceType *string   `bson:"device_type,omitempty"`
	Browser    *string   `bson:"browser,omitempty"`
	Os         *string   `bson:"os,omitempty"`
	IsUnique   bool      `bson:"is_unique"`
}

type counterDocument struct {
	Id  string `bson:"_id"`
	Seq int64  `bson:"seq"`
}

func New(cfg *config.Config) (*Mongo, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	client, err := mongo.Connect(options.Client().ApplyURI(cfg.MongoURI))
	if err != nil {
		return nil, err
	}

	if err := client.Ping(ctx, nil); err != nil {
		return nil, err
	}

	db := client.Database(cfg.DBName)
	s := &Mongo{
		Client: client,
		DB:     db,
	}

	if err := s.ensureIndexes(ctx); err != nil {
		return nil, err
	}

	return s, nil
}

func (s *Mongo) ensureIndexes(ctx context.Context) error {
	_, err := s.urls().Indexes().CreateMany(ctx, []mongo.IndexModel{
		{
			Keys:    bson.D{{Key: "id", Value: 1}},
			Options: options.Index().SetUnique(true),
		},
		{
			Keys:    bson.D{{Key: "short_code", Value: 1}},
			Options: options.Index().SetUnique(true),
		},
		{
			Keys: bson.D{{Key: "user_id", Value: 1}, {Key: "created_at", Value: -1}},
		},
	})
	if err != nil {
		return err
	}

	_, err = s.clicks().Indexes().CreateMany(ctx, []mongo.IndexModel{
		{
			Keys:    bson.D{{Key: "id", Value: 1}},
			Options: options.Index().SetUnique(true),
		},
		{
			Keys: bson.D{{Key: "url_id", Value: 1}, {Key: "clicked_at", Value: -1}},
		},
		{
			Keys: bson.D{{Key: "url_id", Value: 1}, {Key: "ip_hash", Value: 1}},
		},
	})

	return err
}

func (s *Mongo) urls() *mongo.Collection {
	return s.DB.Collection("urls")
}

func (s *Mongo) clicks() *mongo.Collection {
	return s.DB.Collection("clicks")
}

func (s *Mongo) counters() *mongo.Collection {
	return s.DB.Collection("counters")
}

func (s *Mongo) nextSequence(ctx context.Context, name string) (int64, error) {
	opts := options.FindOneAndUpdate().SetUpsert(true).SetReturnDocument(options.After)
	update := bson.M{"$inc": bson.M{"seq": 1}}

	var counter counterDocument
	err := s.counters().FindOneAndUpdate(ctx, bson.M{"_id": name}, update, opts).Decode(&counter)
	if err != nil {
		return 0, err
	}

	return counter.Seq, nil
}

func (s *Mongo) ShortenUrl(longUrl string, alias *string, expiresAt *time.Time, userId *string) (storage.UrlResponse, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	shortCode := ""
	if alias != nil && strings.TrimSpace(*alias) != "" {
		shortCode = strings.TrimSpace(*alias)
	} else {
		shortCode = generateShortCode(7)
	}

	id, err := s.nextSequence(ctx, "urls")
	if err != nil {
		return storage.UrlResponse{}, err
	}

	doc := urlDocument{
		Id:        int(id),
		ShortURL:  shortCode,
		LongURL:   longUrl,
		UserId:    userId,
		CreatedAt: time.Now(),
		ExpiresAt: expiresAt,
	}

	if _, err := s.urls().InsertOne(ctx, doc); err != nil {
		return storage.UrlResponse{}, err
	}

	return urlResponseFromDoc(doc), nil
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

func (s *Mongo) GetAllUrlData(userId string) ([]storage.UrlResponse, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	cursor, err := s.urls().Find(
		ctx,
		bson.M{"user_id": userId},
		options.Find().SetSort(bson.D{{Key: "created_at", Value: -1}}),
	)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var docs []urlDocument
	if err := cursor.All(ctx, &docs); err != nil {
		return nil, err
	}

	urls := make([]storage.UrlResponse, 0, len(docs))
	for _, doc := range docs {
		urls = append(urls, urlResponseFromDoc(doc))
	}

	return urls, nil
}

func (s *Mongo) GetLongUrl(shortCode string) (string, error) {
	if shortCode == "" {
		return "", errors.New("ShortCode not Found")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var doc urlDocument
	err := s.urls().FindOne(ctx, bson.M{"short_code": shortCode}).Decode(&doc)
	if err != nil {
		return "", err
	}

	if doc.ExpiresAt != nil && time.Now().After(*doc.ExpiresAt) {
		return "", errors.New("URL Expired")
	}

	return doc.LongURL, nil
}

func (s *Mongo) DeleteUrl(urlId string, userId string) (bool, error) {
	id, err := strconv.Atoi(urlId)
	if err != nil {
		return false, err
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	res, err := s.urls().DeleteOne(ctx, bson.M{"id": id, "user_id": userId})
	if err != nil {
		return false, err
	}

	if res.DeletedCount == 0 {
		return false, errors.New("Url Not Found")
	}

	_, err = s.clicks().DeleteMany(ctx, bson.M{"url_id": id})
	if err != nil {
		return false, err
	}

	return true, nil
}
