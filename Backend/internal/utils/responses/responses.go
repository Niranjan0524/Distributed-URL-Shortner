package responses

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strings"

	"github.com/go-playground/validator/v10"
)

type Response struct {
	Status string
	Error  string
}

const (
	StatusOk    = "Ok"
	StatusError = "Error"
)

func WriteJson(w http.ResponseWriter, status int, data interface{}) error {
	w.Header().Set("content-Type", "application/json")
	w.WriteHeader(status)

	return json.NewEncoder(w).Encode(data)
}

func GeneralError(err error) Response {
	return Response{
		Status: StatusError,
		Error:  err.Error(),
	}
}

func ValidationError(errs validator.ValidationErrors) Response {
	var errMsgs []string
	for _, err := range errs {
		switch err.ActualTag() {
		case "required":
			errMsgs = append(errMsgs, fmt.Sprintf("feild %s is required", err.Field()))

		default:
			errMsgs = append(errMsgs, fmt.Sprintf("Feild %s is invalid", err.Field()))
		}
	}

	return Response{
		Status: StatusError,
		Error:  strings.Join(errMsgs, ","),
	}
}

func WriteHTML(res http.ResponseWriter, status int, Message string) {

	res.Header().Set("Content-Type", "text/html; charset=utf-8")
	res.WriteHeader(status)

	switch status {
	case http.StatusNotFound:
		res.Write([]byte(errorPage("404", "URL not found", "The short link you opened does not exist or may have been removed.", "Try another short link")))
	case http.StatusGone:
		res.Write([]byte(errorPage("410", "Link expired", "This short link has passed its expiry time and is no longer available.", "Create a fresh short link")))
	default:
		res.Write([]byte(Message))
	}
}

func errorPage(code, title, message, action string) string {
	frontendURL := os.Getenv("FRONTEND_URL")
	if frontendURL == "" {
		frontendURL = "/"
	}

	return fmt.Sprintf(`<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1.0" />
	<title>%s - %s</title>
	<style>
		* {
			box-sizing: border-box;
		}

		body {
			margin: 0;
			min-height: 100vh;
			display: grid;
			place-items: center;
			padding: 24px;
			background:
				radial-gradient(circle at 20%% 20%%, rgba(217, 30, 40, 0.14), transparent 30%%),
				linear-gradient(135deg, #09090b, #141416 55%%, #09090b);
			color: #f4f4f5;
			font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
		}

		main {
			width: min(100%%, 560px);
			padding: 34px 28px;
			text-align: center;
			border-radius: 18px;
			border: 1px solid rgba(255, 255, 255, 0.1);
			background: rgba(24, 24, 27, 0.78);
			box-shadow: 0 22px 70px rgba(0, 0, 0, 0.46), 0 0 0 1px rgba(180, 18, 27, 0.08);
			backdrop-filter: blur(18px);
		}

		.badge {
			width: 72px;
			height: 72px;
			margin: 0 auto 22px;
			display: grid;
			place-items: center;
			border-radius: 18px;
			border: 1px solid rgba(217, 30, 40, 0.26);
			background: linear-gradient(135deg, rgba(180, 18, 27, 0.2), rgba(217, 30, 40, 0.08));
			color: #d91e28;
			font-size: 24px;
			font-weight: 800;
		}

		h1 {
			margin: 0;
			font-size: clamp(30px, 6vw, 46px);
			line-height: 1.05;
			letter-spacing: 0;
		}

		p {
			margin: 14px auto 0;
			max-width: 430px;
			color: #a1a1aa;
			font-size: 16px;
			line-height: 1.65;
		}

		.actions {
			margin-top: 28px;
			display: flex;
			justify-content: center;
			gap: 12px;
			flex-wrap: wrap;
		}

		a {
			min-height: 42px;
			border-radius: 999px;
			padding: 0 18px;
			border: 1px solid rgba(255, 255, 255, 0.1);
			font: inherit;
			font-size: 14px;
			font-weight: 700;
			text-decoration: none;
			cursor: pointer;
			display: inline-flex;
			align-items: center;
			color: #fff;
			background: linear-gradient(135deg, #b4121b, #d91e28);
			box-shadow: 0 0 18px rgba(180, 18, 27, 0.34);
		}

		@media (max-width: 520px) {
			a {
				width: 100%%;
				justify-content: center;
			}
		}
	</style>
</head>
<body>
	<main>
		<div class="badge">%s</div>
		<h1>%s</h1>
		<p>%s</p>
		<div class="actions">
			<a href="%s">%s</a>
		</div>
	</main>
</body>
</html>`, code, title, code, title, message, frontendURL, action)

}
