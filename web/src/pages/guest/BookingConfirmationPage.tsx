import { Alert, Anchor, Badge, Button, Card, Loader, Stack, Text, Title } from "@mantine/core";
import { IconAlertCircle, IconArrowLeft, IconCircleCheck } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { getBooking } from "../../api/bookings";
import type { Booking } from "../../api/types";
import { formatDateTime } from "../../lib/dates";
import { getErrorMessage } from "../../lib/errors";

type BookingLocationState = {
  booking?: Booking;
};

export function BookingConfirmationPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const initialBooking = (location.state as BookingLocationState | null)?.booking;
  const [booking, setBooking] = useState<Booking | undefined>(initialBooking);
  const [loading, setLoading] = useState(!initialBooking);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!id || initialBooking) {
      return;
    }

    getBooking(id)
      .then(setBooking)
      .catch((requestError: unknown) => setError(getErrorMessage(requestError)))
      .finally(() => setLoading(false));
  }, [id, initialBooking]);

  return (
    <main className="guest-shell">
      <div className="guest-frame">
        <header className="brand-bar">
          <Anchor component={Link} to="/" underline="never" className="brand-mark">
            <span className="brand-dot" />
            Naberi
          </Anchor>
        </header>

        {loading && <Loader color="teal" />}

        {error && (
          <Alert color="red" icon={<IconAlertCircle size={18} />} title="Unable to load booking">
            {error}
          </Alert>
        )}

        {!loading && !error && booking && (
          <Card withBorder shadow="sm" radius="md" p="xl" maw={640}>
            <Stack gap="lg">
              <IconCircleCheck size={42} color="var(--mantine-color-teal-7)" />
              <Stack gap={4}>
                <Badge color={booking.status === "Cancelled" ? "gray" : "teal"} w="fit-content">
                  {booking.status}
                </Badge>
                <Title order={1}>Booking confirmed</Title>
                <Text c="dimmed">A confirmation response was returned by the API contract.</Text>
              </Stack>

              <Stack gap="xs">
                <Text>
                  <strong>Guest:</strong> {booking.guestName}
                </Text>
                <Text>
                  <strong>Email:</strong> {booking.guestEmail}
                </Text>
                <Text>
                  <strong>Event type:</strong> {booking.eventTypeId}
                </Text>
                <Text>
                  <strong>Starts:</strong> {formatDateTime(booking.startTime)}
                </Text>
              </Stack>

              <Button component={Link} to="/" variant="light" leftSection={<IconArrowLeft size={16} />} w="fit-content">
                Book another call
              </Button>
            </Stack>
          </Card>
        )}
      </div>
    </main>
  );
}
