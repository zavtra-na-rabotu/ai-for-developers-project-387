import { Button, Stack, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { IconCalendarCheck } from "@tabler/icons-react";

type BookingFormValues = {
  guestName: string;
  guestEmail: string;
};

type BookingFormProps = {
  disabled: boolean;
  loading: boolean;
  onSubmit: (values: BookingFormValues) => void;
};

export function BookingForm({ disabled, loading, onSubmit }: BookingFormProps) {
  const form = useForm<BookingFormValues>({
    initialValues: {
      guestName: "",
      guestEmail: "",
    },
    validate: {
      guestName: (value) => (value.trim().length < 2 ? "Enter your name" : null),
      guestEmail: (value) => (/^\S+@\S+$/.test(value) ? null : "Enter a valid email"),
    },
  });

  return (
    <form onSubmit={form.onSubmit(onSubmit)}>
      <Stack>
        <TextInput label="Name" placeholder="Ada Lovelace" {...form.getInputProps("guestName")} />
        <TextInput
          label="Email"
          placeholder="ada@example.com"
          type="email"
          {...form.getInputProps("guestEmail")}
        />
        <Button
          type="submit"
          loading={loading}
          disabled={disabled}
          leftSection={<IconCalendarCheck size={18} />}
        >
          Confirm booking
        </Button>
      </Stack>
    </form>
  );
}
