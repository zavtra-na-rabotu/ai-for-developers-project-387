import { Badge, Button, Group, Paper, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import { useMemo, useState } from "react";
import type { TimeSlot } from "../../api/types";
import { formatDateKey, formatDateLabel, formatTimeRange } from "../../lib/dates";

type SlotPickerProps = {
  slots: TimeSlot[];
  selectedSlot?: TimeSlot;
  onSelect: (slot: TimeSlot) => void;
};

export function SlotPicker({ slots, selectedSlot, onSelect }: SlotPickerProps) {
  const groupedSlots = useMemo(() => {
    return slots.reduce<Record<string, TimeSlot[]>>((acc, slot) => {
      const key = formatDateKey(slot.startTime);
      acc[key] = [...(acc[key] ?? []), slot];
      return acc;
    }, {});
  }, [slots]);

  const days = Object.keys(groupedSlots);
  const [activeDay, setActiveDay] = useState(days[0]);
  const visibleSlots = activeDay ? groupedSlots[activeDay] ?? [] : [];

  if (slots.length === 0) {
    return (
      <Paper withBorder p="lg" radius="md">
        <Text c="dimmed">No slots are available for this event type yet.</Text>
      </Paper>
    );
  }

  return (
    <Stack gap="md">
      <Group gap="xs">
        {days.map((day) => (
          <Button
            key={day}
            variant={day === activeDay ? "filled" : "light"}
            color="teal"
            size="xs"
            onClick={() => setActiveDay(day)}
          >
            {formatDateLabel(day)}
          </Button>
        ))}
      </Group>

      <Paper withBorder p="lg" radius="md">
        <Group justify="space-between" mb="md">
          <Title order={2} size="h4">
            Pick a time
          </Title>
          <Badge variant="light">{visibleSlots.length} slots</Badge>
        </Group>

        <SimpleGrid cols={{ base: 2, sm: 3 }}>
          {visibleSlots.map((slot) => {
            const isSelected = selectedSlot?.startTime === slot.startTime;

            return (
              <Button
                key={slot.startTime}
                variant={isSelected ? "filled" : "default"}
                color="teal"
                onClick={() => onSelect(slot)}
              >
                {formatTimeRange(slot.startTime, slot.endTime)}
              </Button>
            );
          })}
        </SimpleGrid>
      </Paper>
    </Stack>
  );
}
