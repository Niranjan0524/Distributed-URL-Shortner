package auth

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/Niranjan0524/backend/internal/utils/responses"
	"github.com/nedpals/supabase-go"
)

type contextKey string

const UserIDKey contextKey = "userId"

func VerifyUser(next http.Handler) http.HandlerFunc {
	return http.HandlerFunc(func(res http.ResponseWriter, req *http.Request) {
		authHeader := req.Header.Get("Authorization")

		if authHeader == "" {
			http.Error(res, "Missing token", http.StatusUnauthorized)
			return
		}

		token := strings.TrimPrefix(authHeader, "Bearer ")

		if token == authHeader {
			responses.WriteJson(res, http.StatusNetworkAuthenticationRequired, "No token found")
			return
		}

		user, err := verifySupabaseToken(token)

		if err != nil {
			fmt.Println(err)
			responses.WriteJson(res, http.StatusUnauthorized, err)
			return
		}

		c := context.WithValue(req.Context(), UserIDKey, user.ID)

		req = req.WithContext(c)

		// pass control to next handler
		next.ServeHTTP(res, req)
	})
}

func verifySupabaseToken(token string) (*supabase.User, error) {

	supabaseUrl, isPresent := os.LookupEnv("SUPABASE_URL")
	fmt.Println(supabaseUrl)
	if isPresent == false {
		return nil, errors.New("supabase url not found")
	}

	supabaseAnonKey, isPresent := os.LookupEnv("SUPABASE_ANON_KEY")

	if isPresent == false {
		return nil, errors.New("supabaseAnonKey not found")
	}

	client := supabase.CreateClient(supabaseUrl, supabaseAnonKey)

	ctx, cancel := context.WithTimeout(
		context.Background(),
		60*time.Second,
	)
	defer cancel()

	user, err := client.Auth.User(ctx, token)

	if err != nil {
		return nil, err
	}

	return user, nil

}
