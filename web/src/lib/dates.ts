import dayjs from "dayjs";

export function formatDateTime(value: string) {
  return dayjs(value).format("MMM D, YYYY · HH:mm");
}

export function formatTimeRange(startTime: string, endTime: string) {
  return `${dayjs(startTime).format("HH:mm")} - ${dayjs(endTime).format("HH:mm")}`;
}

export function formatDateKey(value: string) {
  return dayjs(value).format("YYYY-MM-DD");
}

export function formatDateLabel(value: string) {
  return dayjs(value).format("dddd, MMM D");
}
