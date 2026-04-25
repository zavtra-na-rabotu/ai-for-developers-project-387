package naberi

import "time"

const (
	BookingStatusUpcoming  = "Upcoming"
	BookingStatusCancelled = "Cancelled"
)

type ErrorResponse struct {
	Code    int32  `json:"code"`
	Message string `json:"message"`
}

type EventType struct {
	ID          string `json:"id"`
	Title       string `json:"title"`
	Description string `json:"description"`
	Duration    int32  `json:"duration"`
}

type CreateEventTypeRequest struct {
	ID          string `json:"id"`
	Title       string `json:"title"`
	Description string `json:"description"`
	Duration    int32  `json:"duration"`
}

type UpdateEventTypeRequest struct {
	Title       *string `json:"title"`
	Description *string `json:"description"`
	Duration    *int32  `json:"duration"`
}

type Booking struct {
	ID          string    `json:"id"`
	EventTypeID string    `json:"eventTypeId"`
	GuestName   string    `json:"guestName"`
	GuestEmail  string    `json:"guestEmail"`
	StartTime   time.Time `json:"startTime"`
	EndTime     time.Time `json:"endTime"`
	Status      string    `json:"status"`
}

type CreateBookingRequest struct {
	EventTypeID string    `json:"eventTypeId"`
	GuestName   string    `json:"guestName"`
	GuestEmail  string    `json:"guestEmail"`
	StartTime   time.Time `json:"startTime"`
}

type TimeSlot struct {
	StartTime time.Time `json:"startTime"`
	EndTime   time.Time `json:"endTime"`
}

type AvailabilityResponse struct {
	EventTypeID string     `json:"eventTypeId"`
	Slots       []TimeSlot `json:"slots"`
}
