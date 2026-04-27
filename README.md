### Hexlet tests and linter status:
[![Actions Status](https://github.com/zavtra-na-rabotu/ai-for-developers-project-386/actions/workflows/hexlet-check.yml/badge.svg)](https://github.com/zavtra-na-rabotu/ai-for-developers-project-386/actions)

## Deployment

The application is deployed on Render:

https://naberi-ai-for-developers-386.onrender.com

## Go backend

The backend implementation lives in `backend/` and follows the TypeSpec contract from `main.tsp`.
It uses an in-memory store, so event types and bookings are reset when the process restarts.

Run the API:

```sh
cd backend
go run ./cmd/server
```

By default the server listens on `http://localhost:4010`, matching the frontend API client.
Set `NABERI_ADDR` to override the listen address, for example `NABERI_ADDR=:8080`.

Run backend tests:

```sh
cd backend
go test ./...
```

Booking availability is generated for the next 14 calendar days, including today. The default owner schedule is 09:00-18:00 in the server's local timezone, with possible start times every 30 minutes.

## Test coverage

Primary user scenarios are documented in `docs/test-scenarios.md`.

Run the full local check:

```sh
npm run test:web:install
npm test
```

The install command is needed once per local machine to download Chromium for Playwright. The full check compiles the TypeSpec contract, regenerates frontend API types, builds the web app, runs Go backend tests, and runs Playwright integration E2E tests against a real Go API and Vite frontend.

Browser MCP setup for exploratory checks is documented in `docs/browser-mcp.md`.
