package naberi

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"
)

func TestBookingFlowRejectsOverlappingSlotsAcrossEventTypes(t *testing.T) {
	location := time.FixedZone("UTC", 0)
	now := time.Date(2026, 4, 25, 8, 0, 0, 0, location)
	server := NewServer(NewStore(), location)
	server.SetClock(func() time.Time { return now })
	handler := server.Routes()

	postJSON(t, handler, "/admin/event-types", CreateEventTypeRequest{
		ID:          "intro",
		Title:       "Intro Call",
		Description: "A short call.",
		Duration:    30,
	}, http.StatusOK)
	postJSON(t, handler, "/admin/event-types", CreateEventTypeRequest{
		ID:          "deep-dive",
		Title:       "Deep Dive",
		Description: "A longer call.",
		Duration:    60,
	}, http.StatusOK)

	slotStart := time.Date(2026, 4, 25, 9, 0, 0, 0, location)
	var booking Booking
	postJSONInto(t, handler, "/bookings", CreateBookingRequest{
		EventTypeID: "intro",
		GuestName:   "Ada Lovelace",
		GuestEmail:  "ada@example.com",
		StartTime:   slotStart,
	}, http.StatusOK, &booking)

	if booking.EndTime.Sub(booking.StartTime) != 30*time.Minute {
		t.Fatalf("expected 30 minute booking, got %s", booking.EndTime.Sub(booking.StartTime))
	}

	postJSON(t, handler, "/bookings", CreateBookingRequest{
		EventTypeID: "deep-dive",
		GuestName:   "Grace Hopper",
		GuestEmail:  "grace@example.com",
		StartTime:   slotStart,
	}, http.StatusConflict)
}

func TestAvailabilityExcludesBookedAndCancelledSlotsBecomeAvailable(t *testing.T) {
	location := time.FixedZone("UTC", 0)
	now := time.Date(2026, 4, 25, 8, 0, 0, 0, location)
	server := NewServer(NewStore(), location)
	server.SetClock(func() time.Time { return now })
	handler := server.Routes()

	postJSON(t, handler, "/admin/event-types", CreateEventTypeRequest{
		ID:          "intro",
		Title:       "Intro Call",
		Description: "A short call.",
		Duration:    30,
	}, http.StatusOK)

	slotStart := time.Date(2026, 4, 25, 9, 0, 0, 0, location)
	var booking Booking
	postJSONInto(t, handler, "/bookings", CreateBookingRequest{
		EventTypeID: "intro",
		GuestName:   "Ada Lovelace",
		GuestEmail:  "ada@example.com",
		StartTime:   slotStart,
	}, http.StatusOK, &booking)

	var availability AvailabilityResponse
	getJSONInto(t, handler, "/event-types/intro/availability", http.StatusOK, &availability)
	if containsSlot(availability.Slots, slotStart) {
		t.Fatalf("booked slot %s is still available", slotStart)
	}

	postJSON(t, handler, "/admin/bookings/"+booking.ID+"/cancel", nil, http.StatusOK)
	getJSONInto(t, handler, "/event-types/intro/availability", http.StatusOK, &availability)
	if !containsSlot(availability.Slots, slotStart) {
		t.Fatalf("cancelled slot %s was not made available", slotStart)
	}
}

func TestBookingMustMatchGeneratedWindowSlot(t *testing.T) {
	location := time.FixedZone("UTC", 0)
	now := time.Date(2026, 4, 25, 8, 0, 0, 0, location)
	server := NewServer(NewStore(), location)
	server.SetClock(func() time.Time { return now })
	handler := server.Routes()

	postJSON(t, handler, "/admin/event-types", CreateEventTypeRequest{
		ID:          "intro",
		Title:       "Intro Call",
		Description: "A short call.",
		Duration:    30,
	}, http.StatusOK)

	postJSON(t, handler, "/bookings", CreateBookingRequest{
		EventTypeID: "intro",
		GuestName:   "Ada Lovelace",
		GuestEmail:  "ada@example.com",
		StartTime:   time.Date(2026, 4, 25, 8, 30, 0, 0, location),
	}, http.StatusConflict)

	postJSON(t, handler, "/bookings", CreateBookingRequest{
		EventTypeID: "intro",
		GuestName:   "Ada Lovelace",
		GuestEmail:  "ada@example.com",
		StartTime:   time.Date(2026, 5, 9, 9, 0, 0, 0, location),
	}, http.StatusConflict)
}

func postJSON(t *testing.T, handler http.Handler, path string, payload any, expectedStatus int) {
	t.Helper()
	postJSONInto(t, handler, path, payload, expectedStatus, nil)
}

func postJSONInto(t *testing.T, handler http.Handler, path string, payload any, expectedStatus int, target any) {
	t.Helper()

	body := bytes.NewBuffer(nil)
	if payload != nil {
		if err := json.NewEncoder(body).Encode(payload); err != nil {
			t.Fatalf("encode request: %v", err)
		}
	}

	request := httptest.NewRequest(http.MethodPost, path, body)
	request.Header.Set("Content-Type", "application/json")
	response := httptest.NewRecorder()
	handler.ServeHTTP(response, request)

	if response.Code != expectedStatus {
		t.Fatalf("POST %s: expected status %d, got %d: %s", path, expectedStatus, response.Code, response.Body.String())
	}

	if target != nil {
		if err := json.NewDecoder(response.Body).Decode(target); err != nil {
			t.Fatalf("decode response: %v", err)
		}
	}
}

func getJSONInto(t *testing.T, handler http.Handler, path string, expectedStatus int, target any) {
	t.Helper()

	request := httptest.NewRequest(http.MethodGet, path, nil)
	response := httptest.NewRecorder()
	handler.ServeHTTP(response, request)

	if response.Code != expectedStatus {
		t.Fatalf("GET %s: expected status %d, got %d: %s", path, expectedStatus, response.Code, response.Body.String())
	}

	if err := json.NewDecoder(response.Body).Decode(target); err != nil {
		t.Fatalf("decode response: %v", err)
	}
}

func containsSlot(slots []TimeSlot, start time.Time) bool {
	for _, slot := range slots {
		if slot.StartTime.Equal(start.UTC()) {
			return true
		}
	}
	return false
}
