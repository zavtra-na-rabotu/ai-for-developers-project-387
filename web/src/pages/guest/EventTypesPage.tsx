import { Alert, Anchor, Button, Group, Loader, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import { IconAlertCircle, IconCalendarPlus } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listGuestEventTypes } from "../../api/eventTypes";
import type { EventType } from "../../api/types";
import { EventTypeCard } from "../../components/booking/EventTypeCard";
import { getErrorMessage } from "../../lib/errors";

export function EventTypesPage() {
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  useEffect(() => {
    listGuestEventTypes()
      .then((data) => setEventTypes(Array.isArray(data) ? data : []))
      .catch((requestError: unknown) => setError(getErrorMessage(requestError)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="guest-shell">
      <div className="guest-frame">
        <header className="brand-bar">
          <Anchor component={Link} to="/" underline="never" className="brand-mark">
            <span className="brand-dot" />
            Naberi
          </Anchor>
          <Anchor component={Link} to="/admin/event-types" className="admin-link">
            Admin
          </Anchor>
        </header>

        <section className="hero-grid">
          <Stack gap="xl">
            <Stack gap="sm">
              <Text tt="uppercase" fw={800} c="teal" size="sm">
                Call booking
              </Text>
              <Title order={1} size="clamp(2.4rem, 7vw, 5rem)" lh={0.95}>
                Choose a conversation that fits the moment.
              </Title>
              <Text size="lg" c="dimmed" maw={520}>
                Browse available call formats and reserve a time from the live API contract.
              </Text>
            </Stack>

            <Group>
              <Button component={Link} to="/admin/event-types" variant="light" leftSection={<IconCalendarPlus size={18} />}>
                Manage event types
              </Button>
            </Group>
          </Stack>

          <Stack>
            {loading && <Loader color="teal" />}

            {error && (
              <Alert color="red" icon={<IconAlertCircle size={18} />} title="Unable to load event types">
                {error}
              </Alert>
            )}

            {!loading && !error && eventTypes.length === 0 && (
              <Alert color="teal" title="No event types yet">
                Start by creating one in the admin area.
              </Alert>
            )}

            <SimpleGrid cols={{ base: 1, sm: 2 }}>
              {eventTypes.map((eventType) => (
                <EventTypeCard key={eventType.id} eventType={eventType} />
              ))}
            </SimpleGrid>
          </Stack>
        </section>
      </div>
    </main>
  );
}
