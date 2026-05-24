const HEBREW_DAYS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];

function pad(value: number) {
  return value.toString().padStart(2, "0");
}

export function toDateInputValue(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function formatHebrewDate(dateValue: string | null) {
  if (!dateValue) return "לא נקבע";

  const date = new Date(`${dateValue}T12:00:00`);
  if (Number.isNaN(date.getTime())) return dateValue;

  return new Intl.DateTimeFormat("he-IL", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
  }).format(date);
}

export function formatHebrewDateTime(dateValue: string) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return dateValue;

  return new Intl.DateTimeFormat("he-IL", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function inferPickupDate(pickupDateText: string | null, now = new Date()) {
  if (!pickupDateText) return null;

  const normalized = pickupDateText.replace(/[־–—]/g, "-");
  const base = new Date(now);
  base.setHours(12, 0, 0, 0);

  if (normalized.includes("היום") || normalized.includes("להיום")) {
    return toDateInputValue(base);
  }

  if (normalized.includes("מחר")) {
    const tomorrow = new Date(base);
    tomorrow.setDate(base.getDate() + 1);
    return toDateInputValue(tomorrow);
  }

  const dayIndex = HEBREW_DAYS.findIndex((day) => normalized.includes(day));
  if (dayIndex >= 0) {
    const current = base.getDay();
    let delta = dayIndex - current;
    if (delta <= 0) delta += 7;
    const target = new Date(base);
    target.setDate(base.getDate() + delta);
    return toDateInputValue(target);
  }

  return null;
}

export function comparePickupTime(a: string | null, b: string | null) {
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;
  return a.localeCompare(b);
}

export function isEarlyPickup(time: string | null) {
  if (!time) return false;
  const hour = Number(time.split(":")[0]);
  return Number.isFinite(hour) && hour < 10;
}

export function isOvernightTimestamp(dateValue: string | null | undefined) {
  if (!dateValue) return false;
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return false;

  const hour = date.getHours();
  return hour < 7 || hour >= 20;
}

export function isOrderReceivedOvernight(createdAt: string, incomingTimestamps: string[] = []) {
  return [...incomingTimestamps, createdAt].some(isOvernightTimestamp);
}

export function isPastPickup(time: string | null) {
  if (!time) return false;
  const [hour, minute] = time.split(":").map(Number);
  const now = new Date();
  return hour < now.getHours() || (hour === now.getHours() && minute < now.getMinutes());
}
