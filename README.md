# Distributed URL Shortener

A full-stack URL shortener built with **Go**, **PostgreSQL**, **React**, and **Supabase Auth**. It lets users create short links, manage their URLs from a dashboard, and view analytics for link performance.

## Features

- Create shortened URLs from long links
- Support for custom aliases and expiring links
- Redirect short links to their original URLs
- User authentication with Supabase
- Protected dashboard for managing user links
- Link analytics with total clicks, unique clicks, referrers, devices, browsers, OS, and location data
- PostgreSQL-backed persistent storage
- Graceful backend shutdown and basic health check endpoint

## Tech Stack

**Backend**

- Go
- PostgreSQL
- Supabase token verification
- Gorilla CORS handlers
- GeoIP and user-agent parsing for analytics

**Frontend**

- React
- Vite
- Tailwind CSS
- Axios
- React Router
- Supabase JS client

## Project Structure

```text
distributed-url-shortener/
+-- Backend/
|   +-- cmd/api/              # API entry point
|   +-- internal/auth/        # Supabase auth middleware
|   +-- internal/config/      # Environment/config loading
|   +-- internal/http/        # HTTP handlers
|   +-- internal/storage/     # Storage interface and PostgreSQL implementation
|   +-- geo/                  # GeoIP lookup support
+-- Frontend/
|   +-- src/components/       # Reusable UI components
|   +-- src/pages/            # Home, dashboard, analytics pages
|   +-- src/context/          # Auth context
|   +-- src/api/              # Axios API client
+-- Docs/                     # Architecture notes and diagrams
```

## Backend API Overview

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/health` | Checks whether the backend is running |
| `POST` | `/api/shortenUrl` | Creates a short URL |
| `GET` | `/api/urls/recent` | Gets recently created URLs for the user |
| `GET` | `/api/dashboard/urls` | Gets dashboard URL data with click counts |
| `GET` | `/api/analytics/summary` | Gets analytics summary |
| `GET` | `/api/analytics/clicks-over-time` | Gets click trend data |
| `GET` | `/api/analytics/referrers` | Gets referrer analytics |
| `GET` | `/api/analytics/links` | Gets analytics for all links |
| `GET` | `/api/analytics/urls/{urlId}` | Gets analytics for a single URL |
| `DELETE` | `/removeUrl/{urlId}` | Deletes a URL owned by the user |
| `GET` | `/{shortCode}` | Redirects to the original URL |

Most dashboard and analytics endpoints require a Supabase bearer token in the `Authorization` header.

## Environment Variables

### Backend

Create a `.env` file inside `Backend/` or set these variables in your environment:

```env
DATABASE_URL=postgres://username:password@localhost:5432/database_name?sslmode=disable
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
ADDRESS=localhost:8082
FRONTEND_URL=http://localhost:5173
```

Optional:

```env
PORT=8082
FRONTEND_URLS=http://localhost:5173,https://your-frontend-domain.com
```

### Frontend

Create a `.env` file inside `Frontend/`:

```env
VITE_BACKEND_URL=http://localhost:8082
VITE_SERVER_DOMAIN=http://localhost:8082
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Running Locally

### 1. Start the backend

```bash
cd Backend
go mod download
go run ./cmd/api
```

The backend runs on `localhost:8082` by default.

### 2. Start the frontend

```bash
cd Frontend
npm install
npm run dev
```

The frontend runs on `http://localhost:5173`.

## Database

The backend creates the required PostgreSQL tables automatically when it starts:

- `urls` stores short codes, long URLs, owners, creation time, and expiration time
- `clicks` stores analytics events for redirects

## Notes

- Supabase is used for authentication, while PostgreSQL stores the application data.
- Analytics are recorded during redirects and include hashed IP, referrer, device, browser, OS, and location metadata.
- More detailed architecture notes are available in [`Docs/HLD.md`](./Docs/HLD.md).
