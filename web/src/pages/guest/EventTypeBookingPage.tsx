import { Alert, Anchor, Badge, Button, Card, Group, Loader, Stack, Text, Title } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconAlertCircle, IconArrowLeft, IconClock } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { createBooking } from "../../api/bookings";
import { getAvailability, getGuestEventType } from "../../api/eventTypes";
import type { EventType, TimeSlot } from "../../api/types";
import { BookingForm } from "../../components/booking/BookingForm";
import { SlotPicker } from "../../components/booking/SlotPicker";
import { formatDateTime } from "../../lib/dates";
import { getErrorMessage } from "../../lib/errors";

export function EventTypeBookingPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [eventType, setEventType] = useState<EventType>();
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot>();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!id) {
      return;
    }

    Promise.all([getGuestEventType(id), getAvailability(id)])
      .then(([eventTypeData, availability]) => {
        setEventType(eventTypeData);
        setSlots(Array.isArray(availability.slots) ? availability.slots : []);
      })
      .catch((requestError: unknown) => setError(getErrorMessage(requestError)))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <main className="guest-shell">
      <div className="guest-frame">
        <header className="brand-bar">
          <Anchor component={Link} to="/" underline="never" className="brand-mark">
            <span className="brand-dot" />
            Naberi
          </Anchor>
          <Anchor component={Link} to="/" className="admin-link">
            Back to event types
          </Anchor>
        </header>

        {loading && <Loader color="teal" />}

        {error && (
          <Alert color="red" icon={<IconAlertCircle size={18} />} title="Unable to load booking page">
            {error}
          </Alert>
        )}

        {!loading && !error && eventType && (
          <section className="hero-grid">
            <Stack gap="lg">
              <Button component={Link} to="/" variant="subtle" leftSection={<IconArrowLeft size={16} />} w="fit-content">
                All event types
              </Button>
              <Stack gap="xs">
                <Badge color="orange" variant="light" leftSection={<IconClock size={14} />} w="fit-content">
                  {eventType.duration} minutes
                </Badge>
                <Title order={1} size="clamp(2.1rem, 6vw, 4.2rem)" lh={1}>
                  {eventType.title}
                </Title>
                <Text c="dimmed" size="lg">
                  {eventType.description}
                </Text>
              </Stack>

              {selectedSlot && (
                <Card withBorder radius="md" p="lg">
                  <Text size="sm" c="dimmed">
                    Selected time
                  </Text>
                  <Text fw={800}>{formatDateTime(selectedSlot.startTime)}</Text>
                </Card>
              )}
            </Stack>

            <Stack>
              <SlotPicker slots={slots} selectedSlot={selectedSlot} onSelect={setSelectedSlot} />
              <Card withBorder radius="md" p="lg">
                <Group justify="space-between" mb="md">
                  <Title order={2} size="h4">
                    Your details
                  </Title>
                  {!selectedSlot && <Badge variant="light">Pick a slot first</Badge>}
                </Group>
                <BookingForm
                  disabled={!selectedSlot}
                  loading={submitting}
                  onSubmit={(values) => {
                    if (!id || !selectedSlot) {
                      return;
                    }

                    setSubmitting(true);
                    createBooking({
                      eventTypeId: id,
                      guestName: values.guestName,
                      guestEmail: values.guestEmail,
                      startTime: selectedSlot.startTime,
                    })
                      .then((booking) => {
                        notifications.show({
                          color: "teal",
                          title: "Booking confirmed",
                          message: "The API contract returned a booking response.",
                        });
                        navigate(`/bookings/${booking.id}`, { state: { booking } });
                      })
                      .catch((requestError: unknown) => {
                        notifications.show({
                          color: "red",
                          title: "Unable to create booking",
                          message: getErrorMessage(requestError),
                        });
                      })
                      .finally(() => setSubmitting(false));
                  }}
                />
              </Card>
            </Stack>
          </section>
        )}
      </div>
    </main>
  );
}
