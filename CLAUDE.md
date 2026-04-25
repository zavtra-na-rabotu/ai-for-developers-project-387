# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Communication

- Communicate with the user in **Russian**.
- All code comments and documentation (including TypeSpec doc comments, CLAUDE.md, README, etc.) must be written in **English**.

## Project Overview

Naberi is a call booking service. The project is an API specification written in TypeSpec that compiles to an OpenAPI 3.1.0 schema.

## Key Commands

- `npm install` — install dependencies
- `npx tsp compile .` — compile TypeSpec to OpenAPI schema (output: `tsp-output/schema/openapi.yaml`)
- `npx tsp compile . --watch` — compile with file watching

## Architecture

The single source file is `main.tsp`. It contains the full API description for the booking service:

- **Guest-facing endpoints** (`/event-types`, `/bookings`) — public endpoints for guests: browsing event types, checking slot availability, creating and viewing bookings
- **Admin endpoints** (`/admin/event-types`, `/admin/bookings`) — event type and booking management for the calendar owner

Emitter configuration is in `tspconfig.yaml` — generates OpenAPI 3.1.0 into `tsp-output/schema/`.

## TypeSpec Stack

Libraries used: `@typespec/compiler`, `@typespec/http`, `@typespec/rest`, `@typespec/openapi`, `@typespec/openapi3`.
