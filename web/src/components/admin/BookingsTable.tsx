import { ActionIcon, Badge, Table, Text, Tooltip } from "@mantine/core";
import { IconBan } from "@tabler/icons-react";
import type { Booking } from "../../api/types";
import { formatDateTime } from "../../lib/dates";

type BookingsTableProps = {
  bookings: Booking[];
  cancellingId?: string;
  onCancel: (id: string) => void;
};

export function BookingsTable({ bookings, cancellingId, onCancel }: BookingsTableProps) {
  if (bookings.length === 0) {
    return <Text c="dimmed">No bookings yet.</Text>;
  }

  return (
    <Table.ScrollContainer minWidth={760}>
      <Table striped highlightOnHover verticalSpacing="sm">
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Guest</Table.Th>
            <Table.Th>Event type</Table.Th>
            <Table.Th>Start</Table.Th>
            <Table.Th>Status</Table.Th>
            <Table.Th />
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {bookings.map((booking) => (
            <Table.Tr key={booking.id}>
              <Table.Td>
                <Text fw={700}>{booking.guestName}</Text>
                <Text size="sm" c="dimmed">
                  {booking.guestEmail}
                </Text>
              </Table.Td>
              <Table.Td>{booking.eventTypeId}</Table.Td>
              <Table.Td>{formatDateTime(booking.startTime)}</Table.Td>
              <Table.Td>
                <Badge color={booking.status === "Cancelled" ? "gray" : "teal"}>{booking.status}</Badge>
              </Table.Td>
              <Table.Td>
                <Tooltip label="Cancel booking">
                  <ActionIcon
                    aria-label="Cancel booking"
                    color="red"
                    variant="subtle"
                    loading={cancellingId === booking.id}
                    disabled={booking.status === "Cancelled"}
                    onClick={() => onCancel(booking.id)}
                  >
                    <IconBan size={18} />
                  </ActionIcon>
                </Tooltip>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}
