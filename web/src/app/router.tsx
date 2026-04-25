import { createBrowserRouter, Navigate } from "react-router-dom";
import { App } from "./App";
import { AdminLayout } from "../pages/admin/AdminLayout";
import { AdminBookingsPage } from "../pages/admin/AdminBookingsPage";
import { AdminEventTypeFormPage } from "../pages/admin/AdminEventTypeFormPage";
import { AdminEventTypesPage } from "../pages/admin/AdminEventTypesPage";
import { BookingConfirmationPage } from "../pages/guest/BookingConfirmationPage";
import { EventTypeBookingPage } from "../pages/guest/EventTypeBookingPage";
import { EventTypesPage } from "../pages/guest/EventTypesPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <EventTypesPage /> },
      { path: "event-types/:id", element: <EventTypeBookingPage /> },
      { path: "bookings/:id", element: <BookingConfirmationPage /> },
      {
        path: "admin",
        element: <AdminLayout />,
        children: [
          { index: true, element: <Navigate to="/admin/event-types" replace /> },
          { path: "event-types", element: <AdminEventTypesPage /> },
          { path: "event-types/new", element: <AdminEventTypeFormPage /> },
          { path: "event-types/:id", element: <AdminEventTypeFormPage /> },
          { path: "bookings", element: <AdminBookingsPage /> },
        ],
      },
    ],
  },
]);
