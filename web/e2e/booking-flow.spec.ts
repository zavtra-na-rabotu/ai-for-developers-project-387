import { expect, test, type APIRequestContext, type Page } from "@playwright/test";
import dayjs from "dayjs";

const apiBaseURL = "http://127.0.0.1:4101";

type EventTypeInput = {
  id: string;
  title: string;
  description: string;
  duration: number;
};

type TimeSlot = {
  startTime: string;
  endTime: string;
};

test("owner creates event types, guest books a slot, and owner sees the upcoming booking", async ({
  page,
  request,
}, testInfo) => {
  const suffix = uniqueSuffix(testInfo.workerIndex);
  const intro = {
    id: `intro-${suffix}`,
    title: `Intro Call ${suffix}`,
    description: "A focused conversation about goals and next steps.",
    duration: 30,
  };
  const deepDive = {
    id: `deep-dive-${suffix}`,
    title: `Deep Dive ${suffix}`,
    description: "A longer session for detailed planning.",
    duration: 60,
  };

  await createEventTypeThroughAdmin(page, intro);
  await createEventTypeThroughAdmin(page, deepDive);

  await page.goto("/");
  const introCard = page.locator(".mantine-Card-root").filter({ hasText: intro.title });
  await expect(introCard.getByRole("heading", { name: intro.title })).toBeVisible();
  await expect(introCard.getByText(intro.description)).toBeVisible();
  await expect(introCard.getByText(`${intro.duration} min`)).toBeVisible();
  await expect(page.locator(".mantine-Card-root").filter({ hasText: deepDive.title })).toBeVisible();

  const introSlot = await firstAvailableSlot(request, intro.id);
  await introCard.getByRole("button", { name: "Book this call" }).click();
  await selectSlot(page, introSlot);
  await page.getByLabel("Name").fill("Ada Lovelace");
  await page.getByLabel("Email").fill("ada@example.com");
  await page.getByRole("button", { name: "Confirm booking" }).click();

  await expect(page.getByRole("heading", { name: "Booking confirmed" })).toBeVisible();
  await expect(page.getByText("Ada Lovelace")).toBeVisible();
  await expect(page.getByText(intro.id)).toBeVisible();

  await page.goto("/admin/bookings");
  await expect(page.getByRole("heading", { name: "Bookings" })).toBeVisible();
  await expect(page.getByText("Ada Lovelace")).toBeVisible();
  await expect(page.getByText("ada@example.com")).toBeVisible();
  await expect(page.getByText(intro.id)).toBeVisible();

  const overlappingBooking = await request.post(`${apiBaseURL}/bookings`, {
    data: {
      eventTypeId: deepDive.id,
      guestName: "Grace Hopper",
      guestEmail: "grace@example.com",
      startTime: introSlot.startTime,
    },
  });
  expect(overlappingBooking.status()).toBe(409);

  const deepDiveSlots = await availableSlots(request, deepDive.id);
  expect(deepDiveSlots.some((slot) => slot.startTime === introSlot.startTime)).toBe(false);
});

test("guest can book only generated slots inside the fourteen-day window", async ({ request }, testInfo) => {
  const eventType = {
    id: `window-${uniqueSuffix(testInfo.workerIndex)}`,
    title: "Window Check",
    description: "Validates the public booking window.",
    duration: 30,
  };
  await createEventTypeThroughAPI(request, eventType);

  const slots = await availableSlots(request, eventType.id);
  expect(slots.length).toBeGreaterThan(0);

  const firstSlotStart = dayjs(slots[0].startTime);
  const lastSlotStart = dayjs(slots.at(-1)?.startTime);
  expect(lastSlotStart.diff(firstSlotStart, "day")).toBeLessThan(14);

  const outsideWindow = firstSlotStart.add(14, "day").hour(9).minute(0).second(0).millisecond(0).toISOString();
  const outsideWindowBooking = await request.post(`${apiBaseURL}/bookings`, {
    data: {
      eventTypeId: eventType.id,
      guestName: "Outside Window",
      guestEmail: "outside@example.com",
      startTime: outsideWindow,
    },
  });
  expect(outsideWindowBooking.status()).toBe(409);
});

async function createEventTypeThroughAdmin(page: Page, eventType: EventTypeInput) {
  await page.goto("/admin/event-types/new");
  await page.getByLabel("Slug").fill(eventType.id);
  await page.getByLabel("Title").fill(eventType.title);
  await page.getByLabel("Description").fill(eventType.description);
  await page.getByLabel("Duration").fill(String(eventType.duration));
  await page.getByRole("button", { name: "Save event type" }).click();

  await expect(page).toHaveURL(/\/admin\/event-types$/);
  await expect(page.getByRole("heading", { name: eventType.title })).toBeVisible();
}

async function createEventTypeThroughAPI(request: APIRequestContext, eventType: EventTypeInput) {
  const response = await request.post(`${apiBaseURL}/admin/event-types`, { data: eventType });
  expect(response.ok()).toBe(true);
}

async function firstAvailableSlot(request: APIRequestContext, eventTypeID: string) {
  const slots = await availableSlots(request, eventTypeID);
  expect(slots.length).toBeGreaterThan(0);
  return slots[0];
}

async function availableSlots(request: APIRequestContext, eventTypeID: string) {
  const response = await request.get(`${apiBaseURL}/event-types/${eventTypeID}/availability`);
  expect(response.ok()).toBe(true);
  const body = (await response.json()) as { slots: TimeSlot[] };
  return body.slots;
}

async function selectSlot(page: Page, slot: TimeSlot) {
  await page.getByRole("button", { name: dayjs(slot.startTime).format("dddd, MMM D") }).click();
  await page
    .getByRole("button", {
      name: `${dayjs(slot.startTime).format("HH:mm")} - ${dayjs(slot.endTime).format("HH:mm")}`,
    })
    .click();
}

function uniqueSuffix(workerIndex: number) {
  return `${Date.now()}-${workerIndex}`;
}
