import type { OrderStatus } from "@/lib/types";

export const statusLabels: Record<OrderStatus, string> = {
  draft_from_whatsapp: "טיוטה מוואטסאפ",
  missing_details: "חסרים פרטים",
  pending_review: "ממתין לאישור",
  approved: "מאושר",
  in_preparation: "בהכנה",
  ready: "מוכן לאיסוף",
  picked_up: "נאסף",
  cancelled: "בוטל",
  human_review: "דורש בדיקה",
};

export const statusDescriptions: Record<OrderStatus, string> = {
  draft_from_whatsapp: "הודעה נקלטה ועדיין לא גובשה להזמנה מלאה.",
  missing_details: "המערכת ביקשה מהלקוח להשלים פרטים.",
  pending_review: "טיוטת פענוח מוכנה לבדיקת החנות.",
  approved: "אושרה ידנית על ידי החנות.",
  in_preparation: "הצוות התחיל להכין את ההזמנה.",
  ready: "ההזמנה מוכנה וממתינה לאיסוף.",
  picked_up: "הלקוח אסף את ההזמנה.",
  cancelled: "ההזמנה בוטלה.",
  human_review: "נדרשת בדיקה בגלל ניסוח עמום או סיכון תפעולי.",
};

export const statusBadgeClasses: Record<OrderStatus, string> = {
  draft_from_whatsapp:
    "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200",
  missing_details:
    "border-orange-200 bg-orange-50 text-orange-800 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-200",
  pending_review:
    "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200",
  approved:
    "border-teal-200 bg-teal-50 text-teal-900 dark:border-teal-800 dark:bg-teal-950 dark:text-teal-100",
  in_preparation:
    "border-indigo-200 bg-indigo-50 text-indigo-900 dark:border-indigo-800 dark:bg-indigo-950 dark:text-indigo-100",
  ready:
    "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-100",
  picked_up:
    "border-zinc-200 bg-zinc-100 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200",
  cancelled:
    "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200",
  human_review:
    "border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100",
};

export function getStatusLabel(status: OrderStatus) {
  return statusLabels[status] ?? status;
}

export function isActionableStatus(status: OrderStatus) {
  return ["missing_details", "pending_review", "human_review"].includes(status);
}
