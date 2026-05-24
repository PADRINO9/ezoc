import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function createId(prefix = "id") {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${prefix}_${Math.random().toString(36).slice(2)}_${Date.now()}`;
}

export function normalizePhone(phone: string) {
  return phone.replace(/[^\d]/g, "").replace(/^972/, "0");
}

export function formatPhone(phone: string) {
  const normalized = normalizePhone(phone);
  if (normalized.length === 10) {
    return `${normalized.slice(0, 3)}-${normalized.slice(3)}`;
  }
  return phone;
}

export function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}
