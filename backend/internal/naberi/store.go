package naberi

import (
	"errors"
	"fmt"
	"regexp"
	"sort"
	"strings"
	"sync"
	"time"
)

var (
	ErrNotFound        = errors.New("not found")
	ErrAlreadyExists   = errors.New("already exists")
	ErrInvalidInput    = errors.New("invalid input")
	ErrSlotUnavailable = errors.New("slot unavailable")

	eventTypeIDPattern = regexp.MustCompile(`^[a-z0-9-]+$`)
	emailPattern       = regexp.MustCompile(`^\S+@\S+$`)
)

type Store struct {
	mu            sync.RWMutex
	eventTypes    map[string]EventType
	bookings      map[string]Booking
	nextBookingID uint64
}

func NewStore() *Store {
	return &Store{
		eventTypes: make(map[string]EventType),
		bookings:   make(map[string]Booking),
	}
}

func (s *Store) ListEventTypes() []EventType {
	s.mu.RLock()
	defer s.mu.RUnlock()

	eventTypes := make([]EventType, 0, len(s.eventTypes))
	for _, eventType := range s.eventTypes {
		eventTypes = append(eventTypes, eventType)
	}
	sort.Slice(eventTypes, func(i, j int) bool {
		return eventTypes[i].ID < eventTypes[j].ID
	})

	return eventTypes
}

func (s *Store) GetEventType(id string) (EventType, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	eventType, ok := s.eventTypes[id]
	return eventType, ok
}

func (s *Store) CreateEventType(request CreateEventTypeRequest) (EventType, error) {
	eventType, err := validateCreateEventType(request)
	if err != nil {
		return EventType{}, err
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	if _, exists := s.eventTypes[eventType.ID]; exists {
		return EventType{}, fmt.Errorf("%w: event type already exists", ErrAlreadyExists)
	}

	s.eventTypes[eventType.ID] = eventType
	return eventType, nil
}

func (s *Store) UpdateEventType(id string, request UpdateEventTypeRequest) (EventType, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	eventType, exists := s.eventTypes[id]
	if !exists {
		return EventType{}, ErrNotFound
	}

	if request.Title != nil {
		title := strings.TrimSpace(*request.Title)
		if title == "" {
			return EventType{}, fmt.Errorf("%w: title is required", ErrInvalidInput)
		}
		eventType.Title = title
	}

	if request.Description != nil {
		description := strings.TrimSpace(*request.Description)
		if description == "" {
			return EventType{}, fmt.Errorf("%w: description is required", ErrInvalidInput)
		}
		eventType.Description = description
	}

	if request.Duration != nil {
		if *request.Duration <= 0 {
			return EventType{}, fmt.Errorf("%w: duration must be positive", ErrInvalidInput)
		}
		eventType.Duration = *request.Duration
	}

	s.eventTypes[id] = eventType
	return eventType, nil
}

func (s *Store) DeleteEventType(id string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if _, exists := s.eventTypes[id]; !exists {
		return ErrNotFound
	}

	delete(s.eventTypes, id)
	return nil
}

func (s *Store) CreateBooking(request CreateBookingRequest, now time.Time, location *time.Location) (Booking, error) {
	guestName := strings.TrimSpace(request.GuestName)
	guestEmail := strings.TrimSpace(request.GuestEmail)
	if guestName == "" {
		return Booking{}, fmt.Errorf("%w: guestName is required", ErrInvalidInput)
	}
	if !emailPattern.MatchString(guestEmail) {
		return Booking{}, fmt.Errorf("%w: guestEmail must be a valid email address", ErrInvalidInput)
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	eventType, exists := s.eventTypes[request.EventTypeID]
	if !exists {
		return Booking{}, ErrNotFound
	}

	startTime := request.StartTime.UTC()
	endTime := startTime.Add(time.Duration(eventType.Duration) * time.Minute)
	slot := TimeSlot{StartTime: startTime, EndTime: endTime}
	if !isBookableSlot(eventType, slot, now, location) {
		return Booking{}, fmt.Errorf("%w: requested startTime is outside the booking window", ErrSlotUnavailable)
	}
	if s.hasBookingConflict(slot) {
		return Booking{}, fmt.Errorf("%w: requested slot is already taken", ErrSlotUnavailable)
	}

	s.nextBookingID++
	booking := Booking{
		ID:          fmt.Sprintf("booking-%d", s.nextBookingID),
		EventTypeID: eventType.ID,
		GuestName:   guestName,
		GuestEmail:  guestEmail,
		StartTime:   startTime,
		EndTime:     endTime,
		Status:      BookingStatusUpcoming,
	}
	s.bookings[booking.ID] = booking

	return booking, nil
}

func (s *Store) GetBooking(id string) (Booking, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	booking, ok := s.bookings[id]
	return booking, ok
}

func (s *Store) ListUpcomingBookings(now time.Time) []Booking {
	s.mu.RLock()
	defer s.mu.RUnlock()

	bookings := make([]Booking, 0, len(s.bookings))
	for _, booking := range s.bookings {
		if booking.Status == BookingStatusUpcoming && !booking.StartTime.Before(now.UTC()) {
			bookings = append(bookings, booking)
		}
	}
	sort.Slice(bookings, func(i, j int) bool {
		return bookings[i].StartTime.Before(bookings[j].StartTime)
	})

	return bookings
}

func (s *Store) CancelBooking(id string) (Booking, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	booking, exists := s.bookings[id]
	if !exists {
		return Booking{}, ErrNotFound
	}

	booking.Status = BookingStatusCancelled
	s.bookings[id] = booking
	return booking, nil
}

func (s *Store) Availability(eventTypeID string, now time.Time, location *time.Location) (AvailabilityResponse, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	eventType, exists := s.eventTypes[eventTypeID]
	if !exists {
		return AvailabilityResponse{}, ErrNotFound
	}

	slots := make([]TimeSlot, 0)
	for _, slot := range generateSlots(eventType, now, location) {
		if !s.hasBookingConflict(slot) {
			slots = append(slots, slot)
		}
	}

	return AvailabilityResponse{
		EventTypeID: eventTypeID,
		Slots:       slots,
	}, nil
}

func (s *Store) hasBookingConflict(slot TimeSlot) bool {
	for _, booking := range s.bookings {
		if booking.Status != BookingStatusUpcoming {
			continue
		}
		if slot.StartTime.Before(booking.EndTime) && booking.StartTime.Before(slot.EndTime) {
			return true
		}
	}
	return false
}

func validateCreateEventType(request CreateEventTypeRequest) (EventType, error) {
	eventType := EventType{
		ID:          strings.TrimSpace(request.ID),
		Title:       strings.TrimSpace(request.Title),
		Description: strings.TrimSpace(request.Description),
		Duration:    request.Duration,
	}

	if !eventTypeIDPattern.MatchString(eventType.ID) {
		return EventType{}, fmt.Errorf("%w: id must contain lowercase letters, numbers and dashes", ErrInvalidInput)
	}
	if eventType.Title == "" {
		return EventType{}, fmt.Errorf("%w: title is required", ErrInvalidInput)
	}
	if eventType.Description == "" {
		return EventType{}, fmt.Errorf("%w: description is required", ErrInvalidInput)
	}
	if eventType.Duration <= 0 {
		return EventType{}, fmt.Errorf("%w: duration must be positive", ErrInvalidInput)
	}

	return eventType, nil
}
