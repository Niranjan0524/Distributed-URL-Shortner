package futureTime

import (
	"errors"
	"time"
)

func FindFutureTime(expiry string) (*time.Time, error) {
	if expiry == "never" {
		return nil, nil
	}

	var duration time.Duration

	switch expiry {
	case "1h":
		duration = time.Hour
	case "24h":
		duration = 24 * time.Hour
	case "7d":
		duration = 7 * 24 * time.Hour
	case "30d":
		duration = 30 * 24 * time.Hour
	case "1y":
		duration = 365 * 24 * time.Hour
	default:
		return nil, errors.New("invalid expiry value")
	}

	expiresAt := time.Now().Add(duration)
	return &expiresAt, nil
}
