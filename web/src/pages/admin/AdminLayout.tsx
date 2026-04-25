import { AppShell, Anchor, Group, NavLink, Title } from "@mantine/core";
import { IconCalendar, IconListDetails, IconUsers } from "@tabler/icons-react";
import { Link, Outlet, useLocation } from "react-router-dom";

export function AdminLayout() {
  const location = useLocation();

  return (
    <AppShell
      header={{ height: 64 }}
      navbar={{ width: 250, breakpoint: "sm" }}
      padding="lg"
      styles={{
        main: { background: "#f8f6f0" },
        header: { background: "#fffaf0" },
        navbar: { background: "#fffaf0" },
      }}
    >
      <AppShell.Header>
        <Group h="100%" px="lg" justify="space-between">
          <Anchor component={Link} to="/" underline="never" className="brand-mark">
            <span className="brand-dot" />
            Naberi Admin
          </Anchor>
          <Anchor component={Link} to="/" c="teal" fw={700}>
            Guest view
          </Anchor>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <Title order={2} size="h5" mb="md">
          Workspace
        </Title>
        <NavLink
          component={Link}
          to="/admin/event-types"
          label="Event types"
          leftSection={<IconListDetails size={18} />}
          active={location.pathname.startsWith("/admin/event-types")}
        />
        <NavLink
          component={Link}
          to="/admin/bookings"
          label="Bookings"
          leftSection={<IconCalendar size={18} />}
          active={location.pathname === "/admin/bookings"}
        />
        <NavLink label="No auth configured" leftSection={<IconUsers size={18} />} disabled />
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
