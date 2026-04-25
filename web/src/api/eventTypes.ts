import { apiRequest } from "./client";
import type {
  AvailabilityResponse,
  CreateEventTypeRequest,
  EventType,
  UpdateEventTypeRequest,
} from "./types";

export function listGuestEventTypes() {
  return apiRequest<EventType[]>("/event-types");
}

export function getGuestEventType(id: string) {
  return apiRequest<EventType>(`/event-types/${encodeURIComponent(id)}`);
}

export function getAvailability(id: string) {
  return apiRequest<AvailabilityResponse>(`/event-types/${encodeURIComponent(id)}/availability`);
}

export function listAdminEventTypes() {
  return apiRequest<EventType[]>("/admin/event-types");
}

export function getAdminEventType(id: string) {
  return apiRequest<EventType>(`/admin/event-types/${encodeURIComponent(id)}`);
}

export function createEventType(body: CreateEventTypeRequest) {
  return apiRequest<EventType>("/admin/event-types", { method: "POST", body });
}

export function updateEventType(id: string, body: UpdateEventTypeRequest) {
  return apiRequest<EventType>(`/admin/event-types/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body,
  });
}

export function deleteEventType(id: string) {
  return apiRequest<void>(`/admin/event-types/${encodeURIComponent(id)}`, { method: "DELETE" });
}
