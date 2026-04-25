import { Anchor, Badge, Button, Card, Group, Stack, Text, Title } from "@mantine/core";
import { IconArrowRight, IconClock } from "@tabler/icons-react";
import { Link } from "react-router-dom";
import type { EventType } from "../../api/types";

type EventTypeCardProps = {
  eventType: EventType;
};

export function EventTypeCard({ eventType }: EventTypeCardProps) {
  return (
    <Card withBorder shadow="sm" radius="md" padding="lg">
      <Stack gap="md">
        <Group justify="space-between" align="start" gap="xs">
          <Title order={3} size="h4" style={{ flex: 1, minWidth: 0 }}>
            {eventType.title}
          </Title>
          <Badge color="orange" variant="light" leftSection={<IconClock size={14} />} style={{ flexShrink: 0 }}>
            {eventType.duration} min
          </Badge>
        </Group>

        <Text c="dimmed" size="sm">
          {eventType.description}
        </Text>

        <Anchor component={Link} to={`/event-types/${eventType.id}`} underline="never">
          <Button fullWidth rightSection={<IconArrowRight size={16} />} variant="filled">
            Book this call
          </Button>
        </Anchor>
      </Stack>
    </Card>
  );
}
