package auth

import (
	"fmt"
	"net/http"

	"github.com/Niranjan0524/backend/internal/utils/responses"
)

func VerifyUser(next http.Handler) http.HandlerFunc {
	return http.HandlerFunc(func(res http.ResponseWriter, req *http.Request) {

		val := 1 // replace with real auth check

		if val != 1 {
			fmt.Println("not works")
			responses.WriteJson(res, http.StatusUnauthorized, "Auth Required")
			return
		}

		fmt.Println("works")

		// pass control to next handler
		next.ServeHTTP(res, req)
	})
}
