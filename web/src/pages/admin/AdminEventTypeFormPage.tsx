import { Alert, Button, Card, Group, Loader, Stack, Text, Title } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconAlertCircle, IconArrowLeft } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { createEventType, getAdminEventType, updateEventType } from "../../api/eventTypes";
import type { CreateEventTypeRequest, EventType, UpdateEventTypeRequest } from "../../api/types";
import { EventTypeForm } from "../../components/admin/EventTypeForm";
import { getErrorMessage } from "../../lib/errors";

export function AdminEventTypeFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  const [eventType, setEventType] = useState<EventType>();
  const [loading, setLoading] = useState(isEditing);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!id) {
      return;
    }

    getAdminEventType(id)
      .then(setEventType)
      .catch((requestError: unknown) => setError(getErrorMessage(requestError)))
      .finally(() => setLoading(false));
  }, [id]);

  function handleSubmit(values: CreateEventTypeRequest | UpdateEventTypeRequest) {
    setSubmitting(true);
    const request = id
      ? updateEventType(id, values as UpdateEventTypeRequest)
      : createEventType(values as CreateEventTypeRequest);

    request
      .then(() => {
        notifications.show({
          color: "teal",
          title: "Event type saved",
          message: "The API contract accepted the form payload.",
        });
        navigate("/admin/event-types");
      })
      .catch((requestError: unknown) => {
        notifications.show({
          color: "red",
          title: "Unable to save event type",
          message: getErrorMessage(requestError),
        });
      })
      .finally(() => setSubmitting(false));
  }

  return (
    <Stack gap="lg" maw={760}>
      <Group>
        <Button component={Link} to="/admin/event-types" variant="subtle" leftSection={<IconArrowLeft size={16} />}>
          Event types
        </Button>
      </Group>

      <Stack gap={2}>
        <Title order={1}>{isEditing ? "Edit event type" : "New event type"}</Title>
        <Text c="dimmed">These fields map directly to the TypeSpec contract.</Text>
      </Stack>

      {loading && <Loader color="teal" />}

      {error && (
        <Alert color="red" icon={<IconAlertCircle size={18} />} title="Unable to load event type">
          {error}
        </Alert>
      )}

      {!loading && !error && (
        <Card withBorder shadow="sm" radius="md" p="lg">
          <EventTypeForm eventType={eventType} loading={submitting} onSubmit={handleSubmit} />
        </Card>
      )}
    </Stack>
  );
}
