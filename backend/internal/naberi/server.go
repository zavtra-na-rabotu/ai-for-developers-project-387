package naberi

import (
	"encoding/json"
	"errors"
	"net/http"
	"time"
)

type Server struct {
	store    *Store
	location *time.Location
	now      func() time.Time
}

func NewServer(store *Store, location *time.Location) *Server {
	if location == nil {
		location = time.Local
	}

	return &Server{
		store:    store,
		location: location,
		now:      time.Now,
	}
}

func (s *Server) SetClock(now func() time.Time) {
	s.now = now
}

func (s *Server) Routes() http.Handler {
	mux := http.NewServeMux()

	mux.HandleFunc("GET /healthz", s.handleHealth)

	mux.HandleFunc("GET /event-types", s.handleListGuestEventTypes)
	mux.HandleFunc("GET /event-types/{id}", s.handleReadGuestEventType)
	mux.HandleFunc("GET /event-types/{id}/availability", s.handleAvailability)
	mux.HandleFunc("POST /bookings", s.handleCreateBooking)
	mux.HandleFunc("GET /bookings/{id}", s.handleReadBooking)

	mux.HandleFunc("GET /admin/event-types", s.handleListAdminEventTypes)
	mux.HandleFunc("POST /admin/event-types", s.handleCreateEventType)
	mux.HandleFunc("GET /admin/event-types/{id}", s.handleReadAdminEventType)
	mux.HandleFunc("PATCH /admin/event-types/{id}", s.handleUpdateEventType)
	mux.HandleFunc("DELETE /admin/event-types/{id}", s.handleDeleteEventType)
	mux.HandleFunc("GET /admin/bookings", s.handleListAdminBookings)
	mux.HandleFunc("POST /admin/bookings/{id}/cancel", s.handleCancelBooking)

	return corsMiddleware(mux)
}

func (s *Server) handleHealth(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (s *Server) handleListGuestEventTypes(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, s.store.ListEventTypes())
}

func (s *Server) handleReadGuestEventType(w http.ResponseWriter, r *http.Request) {
	s.writeEventType(w, r.PathValue("id"))
}

func (s *Server) handleAvailability(w http.ResponseWriter, r *http.Request) {
	response, err := s.store.Availability(r.PathValue("id"), s.now(), s.location)
	if err != nil {
		writeStoreError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, response)
}

func (s *Server) handleCreateBooking(w http.ResponseWriter, r *http.Request) {
	var request CreateBookingRequest
	if !decodeJSON(w, r, &request) {
		return
	}

	booking, err := s.store.CreateBooking(request, s.now(), s.location)
	if err != nil {
		writeStoreError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, booking)
}

func (s *Server) handleReadBooking(w http.ResponseWriter, r *http.Request) {
	booking, exists := s.store.GetBooking(r.PathValue("id"))
	if !exists {
		writeError(w, http.StatusNotFound, "Booking not found")
		return
	}

	writeJSON(w, http.StatusOK, booking)
}

func (s *Server) handleListAdminEventTypes(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, s.store.ListEventTypes())
}

func (s *Server) handleCreateEventType(w http.ResponseWriter, r *http.Request) {
	var request CreateEventTypeRequest
	if !decodeJSON(w, r, &request) {
		return
	}

	eventType, err := s.store.CreateEventType(request)
	if err != nil {
		writeStoreError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, eventType)
}

func (s *Server) handleReadAdminEventType(w http.ResponseWriter, r *http.Request) {
	s.writeEventType(w, r.PathValue("id"))
}

func (s *Server) handleUpdateEventType(w http.ResponseWriter, r *http.Request) {
	var request UpdateEventTypeRequest
	if !decodeJSON(w, r, &request) {
		return
	}

	eventType, err := s.store.UpdateEventType(r.PathValue("id"), request)
	if err != nil {
		writeStoreError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, eventType)
}

func (s *Server) handleDeleteEventType(w http.ResponseWriter, r *http.Request) {
	if err := s.store.DeleteEventType(r.PathValue("id")); err != nil {
		writeStoreError(w, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (s *Server) handleListAdminBookings(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, s.store.ListUpcomingBookings(s.now()))
}

func (s *Server) handleCancelBooking(w http.ResponseWriter, r *http.Request) {
	booking, err := s.store.CancelBooking(r.PathValue("id"))
	if err != nil {
		writeStoreError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, booking)
}

func (s *Server) writeEventType(w http.ResponseWriter, id string) {
	eventType, exists := s.store.GetEventType(id)
	if !exists {
		writeError(w, http.StatusNotFound, "Event type not found")
		return
	}

	writeJSON(w, http.StatusOK, eventType)
}

func decodeJSON(w http.ResponseWriter, r *http.Request, target any) bool {
	defer r.Body.Close()

	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(target); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid JSON request body")
		return false
	}

	return true
}

func writeJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

func writeError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, ErrorResponse{
		Code:    int32(status),
		Message: message,
	})
}

func writeStoreError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, ErrNotFound):
		writeError(w, http.StatusNotFound, err.Error())
	case errors.Is(err, ErrAlreadyExists):
		writeError(w, http.StatusConflict, err.Error())
	case errors.Is(err, ErrSlotUnavailable):
		writeError(w, http.StatusConflict, err.Error())
	case errors.Is(err, ErrInvalidInput):
		writeError(w, http.StatusBadRequest, err.Error())
	default:
		writeError(w, http.StatusInternalServerError, "Internal server error")
	}
}

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Accept")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}
