package geo

import (
	"net"

	"github.com/oschwald/geoip2-golang"
)

var DB *geoip2.Reader

func InitGeoDB() error {

	db, err := geoip2.Open("geo/GeoLite2-City.mmdb")

	if err != nil {
		return err
	}

	DB = db

	return nil
}

func GetLocation(ip string) (*string, *string) {

	if DB == nil {
		return nil, nil
	}

	parsedIP := net.ParseIP(ip)
	if parsedIP == nil {
		return nil, nil
	}

	record, err := DB.City(parsedIP)

	if err != nil {
		return nil, nil
	}

	country := record.Country.Names["en"]
	city := record.City.Names["en"]

	return &country, &city
}
