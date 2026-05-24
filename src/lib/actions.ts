"use server";

import { redirect } from "next/navigation";
import {
  addProduct,
  coerceUnit,
  processIncomingCustomerMessage,
  saveOrderDetails,
  saveSettings,
  setProductActive,
  updateOrderStatus,
} from "@/lib/data-store";
import type { EditableOrderPayload, OrderStatus } from "@/lib/types";
import { normalizePhone } from "@/lib/utils";

function value(formData: FormData, key: string) {
  const entry = formData.get(key);
  return typeof entry === "string" && entry.trim() ? entry.trim() : null;
}

function numberValue(raw: FormDataEntryValue | null) {
  if (typeof raw !== "string" || !raw.trim()) return null;
  const numeric = Number(raw);
  return Number.isFinite(numeric) ? numeric : null;
}

export async function simulateIncomingMessageAction(formData: FormData) {
  const phone = value(formData, "phone");
  const text = value(formData, "text");

  if (!phone || !text) {
    return;
  }

  await processIncomingCustomerMessage({
    phone: normalizePhone(phone),
    name: value(formData, "name"),
    text,
    timestamp: value(formData, "timestamp") ?? new Date().toISOString(),
    source: "simulator",
  });
}

export async function updateOrderStatusAction(formData: FormData) {
  const orderId = value(formData, "order_id");
  const status = value(formData, "status") as OrderStatus | null;
  if (!orderId || !status) return;

  await updateOrderStatus(orderId, status);
  redirect(`/orders/${orderId}`);
}

export async function saveOrderDetailsAction(formData: FormData) {
  const orderId = value(formData, "order_id");
  if (!orderId) return;

  const itemIds = formData.getAll("item_id");
  const productNames = formData.getAll("product_name");
  const quantities = formData.getAll("quantity");
  const units = formData.getAll("unit");
  const cutStyles = formData.getAll("cut_style");
  const itemNotes = formData.getAll("item_notes");

  const items: EditableOrderPayload["items"] = itemIds.map((id, index) => ({
    id: typeof id === "string" && id ? (id as EditableOrderPayload["items"][number]["id"]) : "new",
    product_name: typeof productNames[index] === "string" ? productNames[index].trim() : "",
    quantity: numberValue(quantities[index] ?? null),
    unit: coerceUnit(units[index] ?? null),
    cut_style:
      typeof cutStyles[index] === "string" && cutStyles[index].trim() ? cutStyles[index].trim() : null,
    notes: typeof itemNotes[index] === "string" ? itemNotes[index].trim() : "",
  }));

  const missingFields = value(formData, "missing_fields")
    ?.split(",")
    .map((item) => item.trim())
    .filter(Boolean) ?? [];

  await saveOrderDetails(orderId, {
    pickup_date_text: value(formData, "pickup_date_text"),
    pickup_time: value(formData, "pickup_time"),
    notes: value(formData, "notes"),
    customer_notes: value(formData, "customer_notes"),
    missing_fields: missingFields,
    human_review_required: formData.get("human_review_required") === "on",
    items,
  });

  redirect(`/orders/${orderId}`);
}

export async function saveSettingsAction(formData: FormData) {
  const threshold = Number(value(formData, "minimum_confidence_threshold") ?? "85");
  await saveSettings({
    business_name: value(formData, "business_name") ?? "בון חכם Demo",
    opening_hours: {
      "א-ה": value(formData, "opening_hours_weekdays") ?? "08:00-18:00",
      שישי: value(formData, "opening_hours_friday") ?? "07:00-14:30",
      שבת: value(formData, "opening_hours_saturday") ?? "סגור",
    },
    pickup_windows:
      value(formData, "pickup_windows")
        ?.split("\n")
        .map((item) => item.trim())
        .filter(Boolean) ?? [],
    after_hours_auto_reply:
      value(formData, "after_hours_auto_reply") ??
      "קיבלנו את ההזמנה. החנות תאשר אותה בשעות הפעילות.",
    minimum_confidence_threshold: Number.isFinite(threshold) ? threshold : 85,
    require_human_approval: formData.get("require_human_approval") === "on",
    default_ai_order_status: (value(formData, "default_ai_order_status") as OrderStatus | null) ?? "pending_review",
  });

  redirect("/settings");
}

export async function addProductAction(formData: FormData) {
  const name = value(formData, "name");
  if (!name) return;

  await addProduct({
    name,
    aliases:
      value(formData, "aliases")
        ?.split(",")
        .map((item) => item.trim())
        .filter(Boolean) ?? [],
    cut_options:
      value(formData, "cut_options")
        ?.split(",")
        .map((item) => item.trim())
        .filter(Boolean) ?? [],
    active: true,
  });

  redirect("/catalog");
}

export async function setProductActiveAction(formData: FormData) {
  const productId = value(formData, "product_id");
  if (!productId) return;

  await setProductActive(productId, formData.get("active") === "true");
  redirect("/catalog");
}
