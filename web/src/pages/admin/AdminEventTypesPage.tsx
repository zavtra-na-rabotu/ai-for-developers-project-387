import {
  ActionIcon,
  Alert,
  Badge,
  Button,
  Card,
  Group,
  Loader,
  SimpleGrid,
  Stack,
  Text,
  Title,
  Tooltip,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconAlertCircle, IconEdit, IconPlus, IconTrash } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { deleteEventType, listAdminEventTypes } from "../../api/eventTypes";
import type { EventType } from "../../api/types";
import { getErrorMessage } from "../../lib/errors";

export function AdminEventTypesPage() {
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string>();
  const [error, setError] = useState<string>();

  function loadEventTypes() {
    setLoading(true);
    listAdminEventTypes()
      .then((data) => setEventTypes(Array.isArray(data) ? data : []))
      .catch((requestError: unknown) => setError(getErrorMessage(requestError)))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadEventTypes();
  }, []);

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <Stack gap={2}>
          <Title order={1}>Event types</Title>
          <Text c="dimmed">Manage the calls guests can book.</Text>
        </Stack>
        <Button component={Link} to="/admin/event-types/new" leftSection={<IconPlus size={18} />}>
          New event type
        </Button>
      </Group>

      {loading && <Loader color="teal" />}

      {error && (
        <Alert color="red" icon={<IconAlertCircle size={18} />} title="Unable to load event types">
          {error}
        </Alert>
      )}

      {!loading && !error && eventTypes.length === 0 && (
        <Alert color="teal" title="No event types yet">
          Create the first event type to make the booking flow useful.
        </Alert>
      )}

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
        {eventTypes.map((eventType) => (
          <Card key={eventType.id} withBorder shadow="sm" radius="md" p="lg">
            <Stack gap="md">
              <Group justify="space-between" align="start">
                <Stack gap={4}>
                  <Title order={2} size="h4">
                    {eventType.title}
                  </Title>
                  <Text size="sm" c="dimmed">
                    /{eventType.id}
                  </Text>
                </Stack>
                <Badge color="orange" variant="light">
                  {eventType.duration} min
                </Badge>
              </Group>
              <Text size="sm" c="dimmed">
                {eventType.description}
              </Text>
              <Group justify="flex-end">
                <Tooltip label="Edit">
                  <ActionIcon
                    component={Link}
                    to={`/admin/event-types/${eventType.id}`}
                    aria-label="Edit event type"
                    variant="subtle"
                  >
                    <IconEdit size={18} />
                  </ActionIcon>
                </Tooltip>
                <Tooltip label="Delete">
                  <ActionIcon
                    aria-label="Delete event type"
                    color="red"
                    variant="subtle"
                    loading={deletingId === eventType.id}
                    onClick={() => {
                      if (!window.confirm(`Delete ${eventType.title}?`)) {
                        return;
                      }

                      setDeletingId(eventType.id);
                      deleteEventType(eventType.id)
                        .then(() => {
                          notifications.show({
                            color: "teal",
                            title: "Event type deleted",
                            message: "The contract endpoint accepted the delete request.",
                          });
                          setEventTypes((current) => current.filter((item) => item.id !== eventType.id));
                        })
                        .catch((requestError: unknown) => {
                          notifications.show({
                            color: "red",
                            title: "Unable to delete event type",
                            message: getErrorMessage(requestError),
                          });
                        })
                        .finally(() => setDeletingId(undefined));
                    }}
                  >
                    <IconTrash size={18} />
                  </ActionIcon>
                </Tooltip>
              </Group>
            </Stack>
          </Card>
        ))}
      </SimpleGrid>
    </Stack>
  );
}
