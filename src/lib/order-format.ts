import type { OrderStatus, OrderWithRelations, Unit } from "@/lib/types";

export function unitLabel(unit: Unit | string, quantity?: number | null) {
  if (unit === "kg") return "ק״ג";
  if (unit === "tray") return quantity === 1 ? "מגש" : "מגשים";
  if (unit === "unit") return quantity === 1 ? "יחידה" : "יחידות";
  return "יחידה לא ידועה";
}

export function formatQuantity(quantity: number | null, unit: Unit | string) {
  if (quantity === null) return "כמות חסרה";
  return `${quantity} ${unitLabel(unit, quantity)}`;
}

export function formatOrderItemLine(item: {
  product_name: string;
  quantity: number | null;
  unit: Unit | string;
  cut_style: string | null;
}) {
  const parts = [item.product_name, formatQuantity(item.quantity, item.unit)];
  if (item.cut_style) parts.push(item.cut_style);
  return parts.join(" — ");
}

export function itemSummary(order: OrderWithRelations) {
  if (order.items.length === 0) return "לא זוהו פריטים";
  return order.items.map(formatOrderItemLine).join(" · ");
}

export function recommendedActionForStatus(status: OrderStatus) {
  const actions: Record<OrderStatus, string> = {
    draft_from_whatsapp: "בדוק פענוח",
    missing_details: "שלח שאלת השלמה",
    human_review: "בדוק ידנית",
    pending_review: "בדוק ואשר",
    approved: "הדפס בון / סמן בהכנה",
    in_preparation: "סמן מוכן לאיסוף",
    ready: "סמן נאסף",
    picked_up: "הושלם",
    cancelled: "בוטל",
  };

  return actions[status];
}

export function printStatusLabel(printedAt: string | null) {
  return printedAt ? "בון הודפס" : "בון לא הודפס";
}
