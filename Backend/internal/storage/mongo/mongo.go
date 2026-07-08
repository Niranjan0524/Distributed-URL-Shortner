package mongo

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"errors"
	"fmt"
	"log/slog"
	"math/big"
	"net/http"
	neturl "net/url"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/Niranjan0524/backend/geo"
	"github.com/Niranjan0524/backend/internal/config"
	"github.com/Niranjan0524/backend/internal/storage"
	"github.com/mssola/user_agent"
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

func (s *Mongo) CheckIfUnique(urlId int, ipHash string) (bool, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	count, err := s.clicks().CountDocuments(ctx, bson.M{"url_id": urlId, "ip_hash": ipHash})
	if err != nil {
		return false, err
	}

	return count == 0, nil
}

func (s *Mongo) SaveAnalytics(req *http.Request) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	shortCode := req.PathValue("shortCode")

	var urlDoc urlDocument
	err := s.urls().FindOne(ctx, bson.M{"short_code": shortCode}).Decode(&urlDoc)
	if err != nil {
		fmt.Println("Error Finding urlId", err)
		return
	}

	ip := GetClientIp(req)
	ipHash := HashIP(ip)
	ref := req.Referer()
	country, city := geo.GetLocation(ip)
	userAgent := req.UserAgent()
	device, browser, os := ParseUserAgent(userAgent)

	isUnique, err := s.CheckIfUnique(urlDoc.Id, ipHash)
	if err != nil {
		fmt.Println("Error in unique check", err)
	}

	id, err := s.nextSequence(ctx, "clicks")
	if err != nil {
		fmt.Println("Error creating click id", err)
		return
	}

	doc := clickDocument{
		Id:         id,
		UrlId:      urlDoc.Id,
		ClickedAt:  time.Now(),
		IpHash:     &ipHash,
		UserAgent:  &userAgent,
		Referer:    &ref,
		Country:    country,
		City:       city,
		DeviceType: device,
		Browser:    browser,
		Os:         os,
		IsUnique:   isUnique,
	}

	if _, err := s.clicks().InsertOne(ctx, doc); err != nil {
		fmt.Println("Error Saving Analytics:", err)
	}
}

func (s *Mongo) GetDashboardData(userId string) ([]storage.DashboardUrls, error) {
	urls, clicksByURL, _, err := s.urlsAndClicks(userId, nil)
	if err != nil {
		return nil, err
	}

	result := make([]storage.DashboardUrls, 0, len(urls))
	for _, doc := range urls {
		result = append(result, storage.DashboardUrls{
			Id:        doc.Id,
			ShortURL:  doc.ShortURL,
			LongURL:   doc.LongURL,
			CreatedAt: doc.CreatedAt,
			ExpiresAt: doc.ExpiresAt,
			Clicks:    len(clicksByURL[doc.Id]),
		})
	}

	return result, nil
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

func (s *Mongo) GetAnalyticsSummary(userId string, rangeName string) (storage.AnalyticsSummary, error) {
	urls, clicksByURL, clicks, err := s.urlsAndClicks(userId, analyticsRangeStart(rangeName))
	if err != nil {
		return storage.AnalyticsSummary{}, err
	}

	summary := storage.AnalyticsSummary{
		TotalLinks:   len(urls),
		TotalClicks:  len(clicks),
		ClicksToday:  clicksOnDate(clicks, time.Now()),
		UniqueClicks: uniqueClickCount(clicks),
	}

	if summary.TotalLinks > 0 {
		summary.AvgClicksPerLink = float64(summary.TotalClicks) / float64(summary.TotalLinks)
	}

	var topURL *urlDocument
	topClicks := -1
	for i := range urls {
		count := len(clicksByURL[urls[i].Id])
		if count > topClicks {
			topURL = &urls[i]
			topClicks = count
		}
	}

	if topURL != nil {
		id := topURL.Id
		summary.TopLinkId = &id
		summary.TopLinkSlug = topURL.ShortURL
		summary.TopLinkClicks = topClicks
	}

	return summary, nil
}

func (s *Mongo) GetAnalyticsLinks(userId string, rangeName string) ([]storage.AnalyticsLink, error) {
	urls, clicksByURL, _, err := s.urlsAndClicks(userId, analyticsRangeStart(rangeName))
	if err != nil {
		return nil, err
	}

	links := make([]storage.AnalyticsLink, 0, len(urls))
	for _, doc := range urls {
		links = append(links, analyticsLinkFromDoc(doc, clicksByURL[doc.Id]))
	}

	sort.SliceStable(links, func(i, j int) bool {
		if links[i].TotalClicks == links[j].TotalClicks {
			return links[i].CreatedAt.After(links[j].CreatedAt)
		}
		return links[i].TotalClicks > links[j].TotalClicks
	})

	return links, nil
}

func (s *Mongo) GetAnalyticsClicksOverTime(userId string, rangeName string) ([]storage.ClicksOverTimePoint, error) {
	start := analyticsRangeStart(rangeName)
	_, _, clicks, err := s.urlsAndClicks(userId, start)
	if err != nil {
		return nil, err
	}

	if start == nil {
		return clickPointsFromExistingDays(clicks), nil
	}

	return clickPointsForLastDays(clicks, analyticsRangeDays(rangeName)), nil
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

func (s *Mongo) GetAnalyticsReferrers(userId string, rangeName string, urlId *string, limit int) ([]storage.ReferrerStat, error) {
	start := analyticsRangeStart(rangeName)
	urls, clicksByURL, clicks, err := s.urlsAndClicks(userId, start)
	if err != nil {
		return nil, err
	}

	if urlId != nil {
		id, err := strconv.Atoi(*urlId)
		if err != nil {
			return nil, err
		}
		if !userOwnsURL(urls, id) {
			return []storage.ReferrerStat{}, nil
		}
		clicks = clicksByURL[id]
	}

	counts := map[string]int{}
	total := 0
	for _, click := range clicks {
		source := "Direct"
		if click.Referer != nil {
			source = referrerSource(*click.Referer)
		}
		counts[source]++
		total++
	}

	stats := make([]storage.ReferrerStat, 0, len(counts))
	for source, count := range counts {
		stats = append(stats, storage.ReferrerStat{
			Source:     source,
			Clicks:     count,
			Percentage: percentage(count, total),
		})
	}

	sort.SliceStable(stats, func(i, j int) bool {
		return stats[i].Clicks > stats[j].Clicks
	})

	return limitStats(stats, limit, total), nil
}

func (s *Mongo) getBreakdown(userId string, urlId string, rangeName string, field string, limit int) ([]storage.BreakdownStat, error) {
	id, err := strconv.Atoi(urlId)
	if err != nil {
		return nil, err
	}

	urls, clicksByURL, _, err := s.urlsAndClicks(userId, analyticsRangeStart(rangeName))
	if err != nil {
		return nil, err
	}
	if !userOwnsURL(urls, id) {
		return []storage.BreakdownStat{}, nil
	}

	counts := map[string]int{}
	total := 0
	for _, click := range clicksByURL[id] {
		label := breakdownLabel(click, field)
		counts[label]++
		total++
	}

	stats := make([]storage.BreakdownStat, 0, len(counts))
	for label, count := range counts {
		stats = append(stats, storage.BreakdownStat{
			Label:      label,
			Clicks:     count,
			Percentage: percentage(count, total),
		})
	}

	sort.SliceStable(stats, func(i, j int) bool {
		return stats[i].Clicks > stats[j].Clicks
	})

	if limit > 0 && len(stats) > limit {
		stats = stats[:limit]
	}

	return stats, nil
}

func (s *Mongo) GetUrlAnalytics(userId string, urlId string, rangeName string) (storage.UrlAnalyticsDetail, error) {
	id, err := strconv.Atoi(urlId)
	if err != nil {
		return storage.UrlAnalyticsDetail{}, err
	}

	urls, clicksByURL, _, err := s.urlsAndClicks(userId, analyticsRangeStart(rangeName))
	if err != nil {
		return storage.UrlAnalyticsDetail{}, err
	}

	var doc *urlDocument
	for i := range urls {
		if urls[i].Id == id {
			doc = &urls[i]
			break
		}
	}
	if doc == nil {
		return storage.UrlAnalyticsDetail{}, mongo.ErrNoDocuments
	}

	clicks := clicksByURL[id]
	link := analyticsLinkFromDoc(*doc, clicks)
	detail := storage.UrlAnalyticsDetail{
		URL: link,
		Summary: storage.AnalyticsSummary{
			TotalLinks:       1,
			TotalClicks:      link.TotalClicks,
			UniqueClicks:     link.UniqueClicks,
			AvgClicksPerLink: float64(link.TotalClicks),
			TopLinkId:        &link.Id,
			TopLinkSlug:      link.ShortURL,
			TopLinkClicks:    link.TotalClicks,
			ClicksToday:      clicksOnDate(clicks, time.Now()),
		},
		ClicksOverTime: clickPointsForLastDays(clicks, analyticsRangeDays(rangeName)),
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

	recentClicks := append([]clickDocument(nil), clicks...)
	sort.SliceStable(recentClicks, func(i, j int) bool {
		return recentClicks[i].ClickedAt.After(recentClicks[j].ClickedAt)
	})
	if len(recentClicks) > 12 {
		recentClicks = recentClicks[:12]
	}

	for _, click := range recentClicks {
		detail.RecentClicks = append(detail.RecentClicks, storage.RecentClick{
			ClickedAt:  click.ClickedAt,
			Referer:    click.Referer,
			Country:    click.Country,
			City:       click.City,
			DeviceType: click.DeviceType,
			Browser:    click.Browser,
			Os:         click.Os,
			IsUnique:   click.IsUnique,
		})
	}

	return detail, nil
}

func (s *Mongo) urlsAndClicks(userId string, start *time.Time) ([]urlDocument, map[int][]clickDocument, []clickDocument, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	cursor, err := s.urls().Find(
		ctx,
		bson.M{"user_id": userId},
		options.Find().SetSort(bson.D{{Key: "created_at", Value: -1}}),
	)
	if err != nil {
		return nil, nil, nil, err
	}
	defer cursor.Close(ctx)

	var urls []urlDocument
	if err := cursor.All(ctx, &urls); err != nil {
		return nil, nil, nil, err
	}

	ids := make([]int, 0, len(urls))
	for _, doc := range urls {
		ids = append(ids, doc.Id)
	}
	if len(ids) == 0 {
		return urls, map[int][]clickDocument{}, []clickDocument{}, nil
	}

	filter := bson.M{"url_id": bson.M{"$in": ids}}
	if start != nil {
		filter["clicked_at"] = bson.M{"$gte": *start}
	}

	clickCursor, err := s.clicks().Find(ctx, filter)
	if err != nil {
		return nil, nil, nil, err
	}
	defer clickCursor.Close(ctx)

	var clicks []clickDocument
	if err := clickCursor.All(ctx, &clicks); err != nil {
		return nil, nil, nil, err
	}

	clicksByURL := map[int][]clickDocument{}
	for _, click := range clicks {
		clicksByURL[click.UrlId] = append(clicksByURL[click.UrlId], click)
	}

	return urls, clicksByURL, clicks, nil
}

func urlResponseFromDoc(doc urlDocument) storage.UrlResponse {
	return storage.UrlResponse{
		Id:        doc.Id,
		ShortURL:  doc.ShortURL,
		LongURL:   doc.LongURL,
		CreatedAt: doc.CreatedAt,
		ExpiresAt: doc.ExpiresAt,
	}
}

func analyticsLinkFromDoc(doc urlDocument, clicks []clickDocument) storage.AnalyticsLink {
	link := storage.AnalyticsLink{
		Id:           doc.Id,
		ShortURL:     doc.ShortURL,
		LongURL:      doc.LongURL,
		CreatedAt:    doc.CreatedAt,
		ExpiresAt:    doc.ExpiresAt,
		TotalClicks:  len(clicks),
		UniqueClicks: uniqueClickCount(clicks),
	}

	for _, click := range clicks {
		if link.LastClickedAt == nil || click.ClickedAt.After(*link.LastClickedAt) {
			clickedAt := click.ClickedAt
			link.LastClickedAt = &clickedAt
		}
	}

	return link
}

func uniqueClickCount(clicks []clickDocument) int {
	count := 0
	for _, click := range clicks {
		if click.IsUnique {
			count++
		}
	}
	return count
}

func clicksOnDate(clicks []clickDocument, day time.Time) int {
	count := 0
	for _, click := range clicks {
		y1, m1, d1 := click.ClickedAt.Date()
		y2, m2, d2 := day.Date()
		if y1 == y2 && m1 == m2 && d1 == d2 {
			count++
		}
	}
	return count
}

func clickPointsFromExistingDays(clicks []clickDocument) []storage.ClicksOverTimePoint {
	byDay := map[string][]clickDocument{}
	for _, click := range clicks {
		key := click.ClickedAt.Format("2006-01-02")
		byDay[key] = append(byDay[key], click)
	}

	days := make([]string, 0, len(byDay))
	for day := range byDay {
		days = append(days, day)
	}
	sort.Strings(days)

	points := make([]storage.ClicksOverTimePoint, 0, len(days))
	for _, day := range days {
		parsed, err := time.Parse("2006-01-02", day)
		if err != nil {
			slog.Warn("invalid analytics day", "day", day, "error", err)
			continue
		}
		points = append(points, storage.ClicksOverTimePoint{
			Date:         day,
			Day:          parsed.Format("Jan 2"),
			Clicks:       len(byDay[day]),
			UniqueClicks: uniqueClickCount(byDay[day]),
		})
	}

	return points
}

func clickPointsForLastDays(clicks []clickDocument, days int) []storage.ClicksOverTimePoint {
	points := make([]storage.ClicksOverTimePoint, 0, days)
	now := time.Now()

	for i := days - 1; i >= 0; i-- {
		day := now.AddDate(0, 0, -i)
		dayClicks := make([]clickDocument, 0)
		for _, click := range clicks {
			y1, m1, d1 := click.ClickedAt.Date()
			y2, m2, d2 := day.Date()
			if y1 == y2 && m1 == m2 && d1 == d2 {
				dayClicks = append(dayClicks, click)
			}
		}

		points = append(points, storage.ClicksOverTimePoint{
			Date:         day.Format("2006-01-02"),
			Day:          day.Format("Jan 2"),
			Clicks:       len(dayClicks),
			UniqueClicks: uniqueClickCount(dayClicks),
		})
	}

	return points
}

func userOwnsURL(urls []urlDocument, id int) bool {
	for _, doc := range urls {
		if doc.Id == id {
			return true
		}
	}
	return false
}

func breakdownLabel(click clickDocument, field string) string {
	var value *string
	switch field {
	case "country":
		value = click.Country
	case "city":
		value = click.City
	case "device_type":
		value = click.DeviceType
	case "browser":
		value = click.Browser
	case "os":
		value = click.Os
	}

	if value == nil || strings.TrimSpace(*value) == "" {
		return "Unknown"
	}

	return *value
}

func percentage(part int, total int) int {
	if total == 0 {
		return 0
	}
	return int(float64(part)/float64(total)*100 + 0.5)
}

func limitStats(stats []storage.ReferrerStat, limit int, total int) []storage.ReferrerStat {
	if limit <= 0 || len(stats) <= limit {
		return stats
	}

	otherClicks := 0
	for _, stat := range stats[limit-1:] {
		otherClicks += stat.Clicks
	}

	stats = stats[:limit-1]
	stats = append(stats, storage.ReferrerStat{
		Source:     "Other",
		Clicks:     otherClicks,
		Percentage: percentage(otherClicks, total),
	})

	return stats
}
