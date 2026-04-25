import { Button, Group, NumberInput, Stack, Textarea, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { IconDeviceFloppy } from "@tabler/icons-react";
import type { CreateEventTypeRequest, EventType, UpdateEventTypeRequest } from "../../api/types";

type EventTypeFormValues = CreateEventTypeRequest;

type EventTypeFormProps = {
  eventType?: EventType;
  loading: boolean;
  onSubmit: (values: CreateEventTypeRequest | UpdateEventTypeRequest) => void;
};

export function EventTypeForm({ eventType, loading, onSubmit }: EventTypeFormProps) {
  const isEditing = Boolean(eventType);
  const form = useForm<EventTypeFormValues>({
    initialValues: {
      id: eventType?.id ?? "",
      title: eventType?.title ?? "",
      description: eventType?.description ?? "",
      duration: eventType?.duration ?? 30,
    },
    validate: {
      id: (value) => (/^[a-z0-9-]+$/.test(value) ? null : "Use lowercase letters, numbers and dashes"),
      title: (value) => (value.trim().length === 0 ? "Title is required" : null),
      description: (value) => (value.trim().length === 0 ? "Description is required" : null),
      duration: (value) => (value > 0 ? null : "Duration must be positive"),
    },
  });

  return (
    <form
      onSubmit={form.onSubmit((values) => {
        if (isEditing) {
          onSubmit({
            title: values.title,
            description: values.description,
            duration: values.duration,
          });
          return;
        }

        onSubmit(values);
      })}
    >
      <Stack>
        <TextInput
          label="Slug"
          placeholder="30min-intro"
          disabled={isEditing}
          {...form.getInputProps("id")}
        />
        <TextInput label="Title" placeholder="30-Minute Intro Call" {...form.getInputProps("title")} />
        <Textarea
          label="Description"
          placeholder="A focused call to talk through goals and next steps."
          minRows={4}
          {...form.getInputProps("description")}
        />
        <NumberInput
          label="Duration"
          min={5}
          step={5}
          suffix=" min"
          {...form.getInputProps("duration")}
        />
        <Group justify="flex-end">
          <Button type="submit" loading={loading} leftSection={<IconDeviceFloppy size={18} />}>
            Save event type
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
