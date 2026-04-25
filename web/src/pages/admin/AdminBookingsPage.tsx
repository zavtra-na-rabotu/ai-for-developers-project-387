import { Alert, Card, Group, Loader, Stack, Text, Title } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconAlertCircle } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { cancelBooking, listAdminBookings } from "../../api/bookings";
import type { Booking } from "../../api/types";
import { BookingsTable } from "../../components/admin/BookingsTable";
import { getErrorMessage } from "../../lib/errors";

export function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    listAdminBookings()
      .then((data) => setBookings(Array.isArray(data) ? data : []))
      .catch((requestError: unknown) => setError(getErrorMessage(requestError)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <Stack gap={2}>
          <Title order={1}>Bookings</Title>
          <Text c="dimmed">Review upcoming calls and test the cancellation contract.</Text>
        </Stack>
      </Group>

      {loading && <Loader color="teal" />}

      {error && (
        <Alert color="red" icon={<IconAlertCircle size={18} />} title="Unable to load bookings">
          {error}
        </Alert>
      )}

      {!loading && !error && (
        <Card withBorder shadow="sm" radius="md" p="lg">
          <BookingsTable
            bookings={bookings}
            cancellingId={cancellingId}
            onCancel={(bookingId) => {
              setCancellingId(bookingId);
              cancelBooking(bookingId)
                .then((updatedBooking) => {
                  notifications.show({
                    color: "teal",
                    title: "Booking cancelled",
                    message: "The API contract returned the cancelled booking.",
                  });
                  setBookings((current) =>
                    current.map((booking) => (booking.id === bookingId ? updatedBooking : booking)),
                  );
                })
                .catch((requestError: unknown) => {
                  notifications.show({
                    color: "red",
                    title: "Unable to cancel booking",
                    message: getErrorMessage(requestError),
                  });
                })
                .finally(() => setCancellingId(undefined));
            }}
          />
        </Card>
      )}
    </Stack>
  );
}
