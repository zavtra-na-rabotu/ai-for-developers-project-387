import "@typespec/http";
import "@typespec/rest";

using Http;
using Rest;

@service(#{ title: "Naberi — Call Booking Service" })
namespace BookingService;

// ---------------------------------------------------------------------------
// Shared models
// ---------------------------------------------------------------------------

@error
model Error {
  code: int32;
  message: string;
}

// ---------------------------------------------------------------------------
// Event types
// ---------------------------------------------------------------------------

/** Represents a bookable event type created by the calendar owner */
model EventType {
  /** Unique slug-style identifier, e.g. "30min-intro" */
  id: string;

  /** Human-readable title shown to guests, e.g. "30-Minute Intro Call" */
  title: string;

  /** Longer description of what the meeting is about */
  description: string;

  /** Duration of the event in minutes */
  @minValue(1)
  duration: int32;
}

/** Request body for creating a new event type */
model CreateEventTypeRequest {
  id: string;
  title: string;
  description: string;
  @minValue(1)
  duration: int32;
}

/** Request body for updating an existing event type (all fields optional) */
model UpdateEventTypeRequest {
  title?: string;
  description?: string;
  @minValue(1)
  duration?: int32;
}

// ---------------------------------------------------------------------------
// Bookings
// ---------------------------------------------------------------------------

/** Status of a booking */
enum BookingStatus {
  Upcoming,
  Cancelled,
}

/** A confirmed booking created by a guest */
model Booking {
  /** Auto-generated unique identifier */
  id: string;

  /** Reference to the event type that was booked */
  eventTypeId: string;

  /** Guest's display name */
  guestName: string;

  /** Guest's email address used for confirmation */
  guestEmail: string;

  /** Booking start time in UTC (ISO 8601) */
  startTime: utcDateTime;

  /** Booking end time in UTC, derived from event type duration */
  endTime: utcDateTime;

  /** Current status of the booking */
  status: BookingStatus;
}

/** Request body for creating a new booking */
model CreateBookingRequest {
  /** ID of the event type to book */
  eventTypeId: string;

  guestName: string;
  guestEmail: string;

  /** Desired start time in UTC (ISO 8601). Must match an available slot. */
  startTime: utcDateTime;
}

// ---------------------------------------------------------------------------
// Availability
// ---------------------------------------------------------------------------

/** A single available time slot within the booking window */
model TimeSlot {
  startTime: utcDateTime;
  endTime: utcDateTime;
}

/** Available slots for an event type within the next 14 days */
model AvailabilityResponse {
  eventTypeId: string;

  /** Ordered list of free slots, each matching the event type duration */
  slots: TimeSlot[];
}

// ---------------------------------------------------------------------------
// Guest-facing endpoints
// ---------------------------------------------------------------------------

/**
 * Public event type discovery.
 * Guests use this to browse what can be booked.
 */
@route("/event-types")
@tag("Guest")
interface GuestEventTypes {
  /** List all active event types */
  @get list(): EventType[] | Error;

  /** Get a single event type by ID */
  @get read(@path id: string): EventType | Error;

  /**
   * Get available time slots for the given event type.
   * Returns free slots within the next 14 days from today.
   */
  @get
  @route("{id}/availability")
  getAvailability(@path id: string): AvailabilityResponse | Error;
}

/**
 * Public booking operations.
 * No authentication required — guests book anonymously.
 */
@route("/bookings")
@tag("Guest")
interface GuestBookings {
  /**
   * Create a new booking.
   * Fails if the requested slot is already taken (any event type).
   */
  @post create(@body body: CreateBookingRequest): Booking | Error;

  /** Get a booking by ID (allows guests to review their confirmation) */
  @get read(@path id: string): Booking | Error;
}

// ---------------------------------------------------------------------------
// Admin endpoints (calendar owner)
// ---------------------------------------------------------------------------

/**
 * Event type management for the calendar owner.
 * No authentication middleware — admin section is access-controlled at the
 * infrastructure level (e.g. private route or basic auth on the gateway).
 */
@route("/admin/event-types")
@tag("Admin")
interface AdminEventTypes {
  /** List all event types */
  @get list(): EventType[] | Error;

  /** Create a new event type */
  @post create(@body body: CreateEventTypeRequest): EventType | Error;

  /** Get a single event type */
  @get read(@path id: string): EventType | Error;

  /** Update an event type */
  @patch update(
    @path id: string,
    @body body: UpdateEventTypeRequest,
  ): EventType | Error;

  /** Delete an event type */
  @delete delete(@path id: string): void | Error;
}

/**
 * Booking management for the calendar owner.
 */
@route("/admin/bookings")
@tag("Admin")
interface AdminBookings {
  /**
   * List all upcoming bookings across all event types, ordered by start time.
   */
  @get list(): Booking[] | Error;

  /**
   * Cancel a booking.
   * Sets status to Cancelled but keeps the record for audit purposes.
   */
  @post
  @route("{id}/cancel")
  cancel(@path id: string): Booking | Error;
}
