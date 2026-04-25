# Repository Agent Guide

This file provides guidance to coding agents working in this repository.

## Communication

- Communicate with the user in **Russian**.
- Write all code comments and documentation in **English**, including TypeSpec doc comments, README updates, and this file.

## Project Overview

Naberi is a call booking service. The API contract is authored in TypeSpec and compiled to an OpenAPI 3.1.0 schema. The repository also contains a Go backend implementation and a React web frontend that follows the TypeSpec contract.

## Key Commands

- `npm install` - install root TypeSpec and tooling dependencies.
- `npm ci` - install root dependencies in CI-style reproducible mode.
- `npm run api:compile` - compile `main.tsp` to `tsp-output/schema/openapi.yaml`.
- `npm run web:api:types` - regenerate frontend API types from the OpenAPI schema.
- `npm run web:build` - build the React frontend.
- `npm run test:backend` - run Go backend tests.
- `npm run test:web:install` - install Chromium for Playwright; needed once per local machine.
- `npm run test:web:e2e` - run Playwright integration E2E tests.
- `npm test` - run the full local check: TypeSpec compile, frontend type generation, frontend build, backend tests, and E2E tests.
- `npm run web:dev` - start the frontend dev server.
- `npm run mock` - start a Prism mock server from the generated OpenAPI schema on port `4010`.

TypeSpec packages used by the contract: `@typespec/compiler`, `@typespec/http`, `@typespec/rest`, `@typespec/openapi`, and `@typespec/openapi3`.

Backend-only commands:

- `cd backend && go run ./cmd/server` - run the Go API on `http://localhost:4010` by default.
- `cd backend && go test ./...` - run backend tests directly.

## Architecture

- `main.tsp` is the source of truth for the HTTP API contract.
- `tspconfig.yaml` configures the OpenAPI 3.1.0 emitter and writes output to `tsp-output/schema/openapi.yaml`.
- `backend/` contains the Go API implementation.
  - `backend/cmd/server/main.go` wires the HTTP server, listen address, and optional static frontend serving.
  - `backend/internal/naberi/server.go` defines HTTP routes and JSON handling.
  - `backend/internal/naberi/store.go` and `availability.go` contain in-memory booking and availability logic.
  - Data is stored in memory, so event types and bookings reset when the process restarts.
- `web/` contains the React frontend.
  - The frontend uses Vite, TypeScript, React Router, Mantine, Tabler icons, Day.js, and `openapi-fetch`-style generated schema types.
  - `web/src/api/schema.ts` is generated from `tsp-output/schema/openapi.yaml`; do not edit it by hand.
  - `VITE_API_BASE_URL` overrides the frontend API base URL. Without it, the frontend uses `http://localhost:4010`.
- `web/e2e/` contains Playwright integration tests. The Playwright config starts a real Go backend on `127.0.0.1:4101` and a Vite frontend on `127.0.0.1:5174`.
- `docs/test-scenarios.md` documents primary user scenarios.
- `docs/browser-mcp.md` documents exploratory browser MCP setup.

## API Surface

Guest endpoints:

- `/event-types` - browse public event types and availability.
- `/bookings` - create and view guest bookings.

Admin endpoints:

- `/admin/event-types` - manage event types.
- `/admin/bookings` - list and cancel bookings.

The backend also exposes `GET /healthz` for health checks.

## Development Notes

- Keep the TypeSpec contract, Go implementation, frontend API calls, and generated frontend types in sync when changing API behavior.
- After editing `main.tsp`, run `npm run api:compile` and `npm run web:api:types`.
- Prefer adding or updating backend tests in `backend/internal/naberi/server_test.go` for API behavior changes.
- Prefer adding or updating Playwright tests in `web/e2e/` for user-facing booking or admin flows.
- Keep generated artifacts out of manual edits unless the repository already treats them as committed outputs.
- Use `NABERI_ADDR` or `PORT` to change the backend listen address.
- Use `NABERI_WEB_DIR` to serve a built frontend from the Go backend; the Docker image sets this to `/app/web`.

## Deployment

The Dockerfile builds the frontend first, then builds the Go server, and finally serves the compiled web assets through the Go backend. Render deployment settings live in `render.yaml`, with `/healthz` configured as the health check path. The deployed Render service URL is documented in `README.md`.
