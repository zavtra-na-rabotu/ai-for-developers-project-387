# Test Scenarios

This document fixes the main product scenarios that must stay covered by automated or MCP-assisted checks.

## Roles and Assumptions

- Calendar owner is a single predefined profile used by the admin area.
- Guests do not register and do not sign in.
- All event types share one calendar, so bookings for different event types still conflict when their time ranges overlap.
- Availability is generated for fourteen calendar days starting from the current date.

## Owner Scenarios

1. Owner creates an event type with slug, title, description, and duration.
   - Expected: the event type is stored, appears in the admin list, and is visible to guests.
   - Automated coverage: `web/e2e/booking-flow.spec.ts`.

2. Owner views upcoming bookings across all event types.
   - Expected: bookings are shown in one list sorted by start time.
   - Automated coverage: `web/e2e/booking-flow.spec.ts` and `backend/internal/naberi/server_test.go`.

3. Owner cancels a booking.
   - Expected: the booking status changes to `Cancelled`, and the slot becomes available again.
   - Automated coverage: `backend/internal/naberi/server_test.go`.

## Guest Scenarios

1. Guest browses available event types.
   - Expected: each card shows title, description, and duration.
   - Automated coverage: `web/e2e/booking-flow.spec.ts`.

2. Guest selects an event type and chooses a free slot.
   - Expected: only generated, currently free slots are selectable.
   - Automated coverage: `web/e2e/booking-flow.spec.ts`.

3. Guest creates a booking for a selected slot.
   - Expected: a booking confirmation is returned and displayed.
   - Automated coverage: `web/e2e/booking-flow.spec.ts` and `backend/internal/naberi/server_test.go`.

4. Guest cannot book outside the fourteen-day window.
   - Expected: the API rejects the request with `409 Conflict`.
   - Automated coverage: `web/e2e/booking-flow.spec.ts` and `backend/internal/naberi/server_test.go`.

## Availability and Conflict Scenarios

1. Two bookings cannot overlap even when they belong to different event types.
   - Expected: the second booking is rejected with `409 Conflict`, and the overlapping slot is removed from availability.
   - Automated coverage: `web/e2e/booking-flow.spec.ts` and `backend/internal/naberi/server_test.go`.

2. A cancelled booking no longer blocks the slot.
   - Expected: the cancelled slot appears again in availability.
   - Automated coverage: `backend/internal/naberi/server_test.go`.

## MCP-Assisted Browser Checks

Use MCP checks for exploratory verification, debugging failed E2E runs, and inspecting console or network behavior. Deterministic CI coverage is provided by Playwright tests.

Recommended prompts:

- With Playwright MCP: "Open http://127.0.0.1:5173, create an event type from the admin area, book the first available guest slot, and confirm that the booking appears under admin bookings."
- With Chrome DevTools MCP: "Open http://127.0.0.1:5173, inspect console messages and network requests while the guest booking flow runs, and report failed requests or runtime errors."
