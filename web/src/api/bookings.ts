import { apiRequest } from "./client";
import type { Booking, CreateBookingRequest } from "./types";

export function createBooking(body: CreateBookingRequest) {
  return apiRequest<Booking>("/bookings", { method: "POST", body });
}

export function getBooking(id: string) {
  return apiRequest<Booking>(`/bookings/${encodeURIComponent(id)}`);
}

export function listAdminBookings() {
  return apiRequest<Booking[]>("/admin/bookings");
}

export function cancelBooking(id: string) {
  return apiRequest<Booking>(`/admin/bookings/${encodeURIComponent(id)}/cancel`, {
    method: "POST",
  });
}
