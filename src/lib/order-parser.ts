import type {
  OrderStatus,
  ParsedOrderItem,
  ParsedOrderResult,
  Product,
  Settings,
  Unit,
  Urgency,
} from "@/lib/types";
import { normalizePhone } from "@/lib/utils";

const AMBIGUOUS_PHRASES = [
  "כמו פעם שעברה",
  "כמו שבוע שעבר",
  "כמו תמיד",
  "כרגיל",
  "מה שהיה",
  "מה שהיה פעם שעברה",
  "תעשה לי דגים לשבת",
];
const PRICE_PHRASES = ["כמה עולה", "מחיר", "תעדכן כמה", "כמה יעלה", "מה המחיר"];
const URGENT_PHRASES = ["דחוף", "כמה שיותר מהר", "להיום", "עכשיו"];
const VAGUE_FISH_PHRASES = ["דגים לשבת", "תעשה לי דגים", "דגים כמו תמיד"];
const CUT_STYLES = [
  "פילה בלי עור",
  "פילה עם עור",
  "בלי עור",
  "עם עור",
  "פילה",
  "נקיים",
  "נקי",
  "פרוסות",
  "פרוס",
  "קוביות",
  "סביצ׳ה",
  "סביצ'ה",
  "טחון",
  "לשבת",
  "סטייק",
  "מגש",
];
const HEBREW_NUMBERS: Record<string, number> = {
  אחד: 1,
  אחת: 1,
  שני: 2,
  שניים: 2,
  שתי: 2,
  שתיים: 2,
  שלושה: 3,
  שלוש: 3,
  ארבעה: 4,
  ארבע: 4,
  חמישה: 5,
  חמש: 5,
  שישה: 6,
  שש: 6,
  שבעה: 7,
  שבע: 7,
  שמונה: 8,
  תשעה: 9,
  תשע: 9,
  עשרה: 10,
  עשר: 10,
};
const NUMBER_PATTERN = String.raw`\d+(?:\.\d+)?|אחד|אחת|שני|שניים|שתי|שתיים|שלושה|שלוש|ארבעה|ארבע|חמישה|חמש|שישה|שש|שבעה|שבע|שמונה|תשעה|תשע|עשרה|עשר`;
const NAME_BLOCKLIST = new Set([
  "אני",
  "רוצה",
  "צריך",
  "צריכה",
  "אפשר",
  "שלום",
  "היי",
  "אחי",
  "בוקר",
  "שישי",
  "שבת",
  "ראשון",
  "שני",
  "שלישי",
  "רביעי",
  "חמישי",
  "היום",
  "מחר",
  "בבוקר",
  "סלמון",
  "דגים",
  "דג",
  "מחיר",
  "קילו",
  "קג",
  "ק״ג",
  "מגש",
  "מגשים",
  "יחידות",
]);

function cleanText(text: string) {
  return text
    .replace(/[״"]/g, '"')
    .replace(/[׳']/g, "׳")
    .replace(/[־–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

function unique<T>(items: T[]) {
  return [...new Set(items)];
}

function detectPhone(text: string) {
  const match = text.match(/(?:\+?972[-\s]?)?0?5\d[-\s]?\d{7}/);
  return match ? normalizePhone(match[0]) : null;
}

function parseNumberToken(value: string) {
  const normalized = value.trim();
  if (normalized === "חצי") return 0.5;
  if (normalized === "רבע") return 0.25;
  const numeric = Number(normalized);
  if (Number.isFinite(numeric)) return numeric;
  return HEBREW_NUMBERS[normalized] ?? null;
}

function productNameBlocklist(catalog: Product[]) {
  return new Set(
    catalog.flatMap((product) => [product.name, ...product.aliases]).flatMap((name) => name.split(/\s+/)),
  );
}

function isValidCustomerName(value: string, catalog: Product[]) {
  const name = value.replace(/[^\u0590-\u05FF\s]/g, " ").replace(/\s+/g, " ").trim();
  if (!name || name.length < 2) return false;

  const words = name.split(" ").filter(Boolean);
  if (words.length > 3) return false;

  const blockedProducts = productNameBlocklist(catalog);
  return words.every((word) => !NAME_BLOCKLIST.has(word) && !blockedProducts.has(word));
}

function pickNameCandidate(value: string, catalog: Product[]) {
  const words = value
    .replace(/[^\u0590-\u05FF\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean);

  for (const size of [2, 1]) {
    const candidate = words.slice(-size).join(" ");
    if (isValidCustomerName(candidate, catalog)) return candidate;
  }

  return null;
}

function detectName(text: string, phone: string | null, catalog: Product[]) {
  if (phone) {
    const phoneIndex = text.search(/(?:\+?972[-\s]?)?0?5\d[-\s]?\d{7}/);
    const beforePhone = phoneIndex >= 0 ? text.slice(Math.max(0, phoneIndex - 48), phoneIndex) : "";
    const nearPhoneName = pickNameCandidate(beforePhone, catalog);
    if (nearPhoneName) return nearPhoneName;
  }

  const explicit = text.match(/(?:שמי|קוראים לי|שם(?: מלא)?[:\s]+)\s*([א-ת]{2,}(?:\s+[א-ת]{2,}){0,2})/);
  if (explicit?.[1] && isValidCustomerName(explicit[1], catalog)) return explicit[1].trim();

  const commaParts = text.split(",");
  if (commaParts.length > 1) {
    const trailing = pickNameCandidate(commaParts.at(-1) ?? "", catalog);
    if (trailing) return trailing;
  }

  return null;
}

function detectPickupTime(text: string) {
  if (/בין\s+10\s+ל-?11/.test(text)) return "10:00-11:00";
  if (/בעשר\s+וחצי|ב-?10\s*וחצי/.test(text)) return "10:30";
  if (/לקראת\s+12/.test(text)) return "12:00";
  if (/לפני\s+10/.test(text)) return "לפני 10:00";

  const colonTime = text.match(/(?:^|[^\d])(\d{1,2}):(\d{2})(?:$|[^\d])/);
  if (colonTime) {
    return `${colonTime[1].padStart(2, "0")}:${colonTime[2]}`;
  }

  const prefixed = text.match(/(?:^|\s)(?:ב|ל|בשעה|לשעה|ב-|ל-)\s*-?\s*(\d{1,2})(?!\s*(?:קילו|קג|ק״ג|מגש|מגשים|דניס|דניסים|לברק|לברקים))/);
  if (prefixed) {
    const hour = Number(prefixed[1]);
    if (hour >= 6 && hour <= 22) {
      return `${hour.toString().padStart(2, "0")}:00`;
    }
  }

  return null;
}

function detectPickupDateText(text: string) {
  const fragments = ["שישי בבוקר", "שישי", "מחר", "היום", "להיום", "שבת", "ראשון", "שני", "שלישי", "רביעי", "חמישי"];
  return fragments.find((fragment) => text.includes(fragment)) ?? null;
}

function detectUrgency(text: string): Urgency {
  return URGENT_PHRASES.some((phrase) => text.includes(phrase)) ? "urgent" : "normal";
}

function aliasesFor(product: Product) {
  return [product.name, ...product.aliases].filter(Boolean).sort((a, b) => b.length - a.length);
}

function findProductMatches(text: string, catalog: Product[]) {
  return catalog
    .filter((product) => product.active)
    .flatMap((product) =>
      aliasesFor(product).flatMap((alias) => {
        const index = text.indexOf(alias);
        return index >= 0 ? [{ product, alias, index }] : [];
      }),
    )
    .sort((a, b) => a.index - b.index);
}

function parseQuantityAround(text: string, alias: string, index: number): { quantity: number | null; unit: Unit } {
  const start = Math.max(0, index - 32);
  const end = Math.min(text.length, index + alias.length + 32);
  const window = text.slice(start, end);
  const before = text.slice(Math.max(0, index - 24), index);
  const after = text.slice(index, Math.min(text.length, index + alias.length + 24));

  if (/קילו\s+וחצי/.test(before) || /קילו\s+וחצי/.test(window)) return { quantity: 1.5, unit: "kg" };
  if (/חצי\s*(?:קילו|קג|ק״ג)/.test(before) || /חצי\s*(?:קילו|קג|ק״ג)/.test(window)) return { quantity: 0.5, unit: "kg" };
  if (/רבע\s*(?:קילו|קג|ק״ג)/.test(before) || /רבע\s*(?:קילו|קג|ק״ג)/.test(window)) return { quantity: 0.25, unit: "kg" };

  const kgPattern = new RegExp(`(${NUMBER_PATTERN})\\s*(?:קילו|קג|ק״ג)`);
  const kgBefore = before.match(new RegExp(`(${NUMBER_PATTERN})\\s*(?:קילו|קג|ק״ג)\\s*$`));
  if (kgBefore) return { quantity: parseNumberToken(kgBefore[1]), unit: "kg" };

  const kgWindow = window.match(kgPattern);
  if (kgWindow) return { quantity: parseNumberToken(kgWindow[1]), unit: "kg" };

  const singleKg = before.match(/(?:^|\s)קילו\s*$/);
  if (singleKg) return { quantity: 1, unit: "kg" };

  const trayBefore = before.match(new RegExp(`(${NUMBER_PATTERN})\\s*(?:מגש|מגשים)\\s*(?:של)?\\s*$`));
  if (trayBefore) return { quantity: parseNumberToken(trayBefore[1]), unit: "tray" };

  const trayWindow = window.match(new RegExp(`(${NUMBER_PATTERN})\\s*(?:מגש|מגשים)`));
  if (trayWindow) return { quantity: parseNumberToken(trayWindow[1]), unit: "tray" };

  const unitsBefore = before.match(new RegExp(`(${NUMBER_PATTERN})\\s*$`));
  if (unitsBefore && /(?:ים|ות|י)$/.test(alias)) {
    return { quantity: parseNumberToken(unitsBefore[1]), unit: "unit" };
  }

  const unitsAfter = after.match(new RegExp(`${alias}\\s*(${NUMBER_PATTERN})`));
  if (unitsAfter) return { quantity: parseNumberToken(unitsAfter[1]), unit: "unit" };

  return { quantity: null, unit: "unknown" };
}

function detectCutStyle(text: string, alias: string, index: number) {
  const start = Math.max(0, index - 12);
  const end = Math.min(text.length, index + alias.length + 46);
  const window = text.slice(start, end);

  if (/פילה\s+בלי\s+עור|בלי\s+עור.*פילה|פילה.*בלי\s+עור/.test(window)) return "פילה בלי עור";
  if (/פילה\s+עם\s+עור|עם\s+עור.*פילה|פילה.*עם\s+עור/.test(window)) return "פילה עם עור";

  const cut = CUT_STYLES.find((style) => window.includes(style));
  if (!cut) return null;

  if (cut === "נקיים") return "נקי";
  if (cut === "פרוס") return "פרוסות";
  if (cut === "סביצ'ה") return "סביצ׳ה";
  return cut;
}

function detectItems(text: string, catalog: Product[]) {
  const matches = findProductMatches(text, catalog);
  const seen = new Set<string>();
  const items: ParsedOrderItem[] = [];

  for (const match of matches) {
    if (match.product.name === "סביצ׳ה" && text[match.index - 1] === "ל") continue;
    if (seen.has(match.product.name)) continue;
    seen.add(match.product.name);

    const quantity = parseQuantityAround(text, match.alias, match.index);
    const cutStyle = detectCutStyle(text, match.alias, match.index);
    items.push({
      productName: match.product.name,
      quantity: quantity.quantity,
      unit: quantity.unit,
      cutStyle,
      notes: "",
    });
  }

  return items;
}

function buildMissingFields(result: {
  customerName: string | null;
  phone: string | null;
  pickupTime: string | null;
  items: ParsedOrderItem[];
}) {
  const missing: string[] = [];
  if (!result.customerName) missing.push("customer_name");
  if (!result.phone) missing.push("phone");
  if (!result.pickupTime) missing.push("pickup_time");
  if (result.items.length === 0) missing.push("items");
  if (result.items.some((item) => item.quantity === null)) missing.push("quantity");
  return unique(missing);
}

function scoreConfidence(options: {
  missingFields: string[];
  hasAmbiguousReference: boolean;
  hasPriceRequest: boolean;
  hasUnknownProduct: boolean;
  hasVagueRequest: boolean;
}) {
  let confidence = 96;

  if (options.missingFields.includes("customer_name")) confidence -= 8;
  if (options.missingFields.includes("phone")) confidence -= 8;
  if (options.missingFields.includes("pickup_time")) confidence -= 14;
  if (options.missingFields.includes("quantity")) confidence -= 18;
  if (options.missingFields.includes("items")) confidence -= 22;
  if (options.hasUnknownProduct) confidence -= 22;
  if (options.hasAmbiguousReference) confidence -= 34;
  if (options.hasVagueRequest) confidence -= 28;
  if (options.hasPriceRequest) confidence -= 10;

  return Math.max(35, Math.min(96, confidence));
}

function chooseStatus(options: {
  missingFields: string[];
  humanReviewRequired: boolean;
  hasAmbiguousReference: boolean;
}): OrderStatus {
  if (options.hasAmbiguousReference) return "human_review";
  if (options.missingFields.length > 0) return "missing_details";
  if (options.humanReviewRequired) return "human_review";
  return "pending_review";
}

function buildSuggestedReply(options: {
  missingFields: string[];
  hasAmbiguousReference: boolean;
  hasPriceRequest: boolean;
  hasUnknownProduct: boolean;
  hasVagueRequest: boolean;
  status: OrderStatus;
}) {
  if (options.hasAmbiguousReference) {
    return "קיבלנו את הבקשה, אבל ההזמנה דורשת בדיקה של החנות כי היא מתייחסת להזמנה קודמת.";
  }

  if (options.hasPriceRequest) {
    if (options.missingFields.includes("quantity") || options.missingFields.includes("pickup_time")) {
      return "המחיר הסופי ייקבע לפי משקל, זמינות ואישור החנות. כמה ק״ג תרצה להזמין ולאיזו שעה?";
    }

    return "המחיר הסופי ייקבע לפי משקל, זמינות ואישור החנות. ההזמנה תעבור לבדיקה לפני הכנה.";
  }

  if (options.hasUnknownProduct || options.hasVagueRequest || options.missingFields.includes("items")) {
    return "קיבלנו את ההודעה, אבל לא הצלחנו לזהות בוודאות את כל הפריטים. החנות תבדוק ותעדכן.";
  }

  if (options.missingFields.includes("pickup_time")) {
    return "חסרה שעת איסוף. לאיזו שעה תרצה שההזמנה תהיה מוכנה?";
  }

  if (options.missingFields.includes("quantity")) {
    return "בשמחה. כמה ק״ג תרצה להזמין?";
  }

  if (options.missingFields.includes("customer_name") && options.missingFields.includes("phone")) {
    return "אפשר. אפשר לקבל שם מלא וטלפון לרישום ההזמנה?";
  }

  if (options.missingFields.includes("customer_name")) {
    return "קיבלנו את ההזמנה. אפשר לקבל שם מלא לרישום ההזמנה?";
  }

  if (options.status === "human_review") {
    return "קיבלנו את ההזמנה. היא תעבור לבדיקה של החנות לפני אישור והכנה.";
  }

  return "קיבלנו את ההזמנה שלך. היא נכנסה למערכת ותעבור לאישור החנות בבוקר.";
}

export function applyKnownCustomerDetails(
  parsed: ParsedOrderResult,
  known: { name?: string | null; phone?: string | null },
  settings: Settings,
): ParsedOrderResult {
  const customerName = known.name || parsed.customerName || null;
  const phone = known.phone ? normalizePhone(known.phone) : parsed.phone;
  const missingFields = buildMissingFields({
    customerName,
    phone,
    pickupTime: parsed.pickupTime,
    items: parsed.items,
  });
  const hasAmbiguousReference = parsed.suggestedReply.includes("הזמנה קודמת");
  const hasUnknownProduct = parsed.items.some((item) => item.productName === "דגים לא מזוהים");
  const hasVagueRequest = parsed.items.some((item) => item.notes.includes("ניסוח כללי"));
  const hasPriceRequest = parsed.suggestedReply.includes("המחיר הסופי");
  const aiConfidence = scoreConfidence({
    missingFields,
    hasAmbiguousReference,
    hasPriceRequest,
    hasUnknownProduct,
    hasVagueRequest,
  });
  const humanReviewRequired =
    parsed.humanReviewRequired || aiConfidence < settings.minimum_confidence_threshold || hasUnknownProduct;
  const status = chooseStatus({ missingFields, humanReviewRequired, hasAmbiguousReference });

  return {
    ...parsed,
    customerName,
    phone,
    missingFields,
    aiConfidence,
    humanReviewRequired,
    status,
    suggestedReply: buildSuggestedReply({
      missingFields,
      hasAmbiguousReference,
      hasPriceRequest,
      hasUnknownProduct,
      hasVagueRequest,
      status,
    }),
  };
}

export function parseCustomerOrderMessage(
  message: string,
  catalog: Product[],
  settings: Settings,
): ParsedOrderResult {
  const text = cleanText(message);
  const phone = detectPhone(text);
  const customerName = detectName(text, phone, catalog);
  const pickupDateText = detectPickupDateText(text);
  const pickupTime = detectPickupTime(text);
  const items = detectItems(text, catalog);
  const hasAmbiguousReference = AMBIGUOUS_PHRASES.some((phrase) => text.includes(phrase));
  const hasPriceRequest = PRICE_PHRASES.some((phrase) => text.includes(phrase));
  const hasUnknownProduct = items.some((item) => item.productName === "דגים לא מזוהים");
  const hasVagueRequest = VAGUE_FISH_PHRASES.some((phrase) => text.includes(phrase));
  const urgency = detectUrgency(text);
  const missingFields = buildMissingFields({ customerName, phone, pickupTime, items });
  const aiConfidence = scoreConfidence({
    missingFields,
    hasAmbiguousReference,
    hasPriceRequest,
    hasUnknownProduct,
    hasVagueRequest,
  });
  const humanReviewRequired =
    hasAmbiguousReference ||
    hasPriceRequest ||
    hasUnknownProduct ||
    hasVagueRequest ||
    aiConfidence < settings.minimum_confidence_threshold;
  const status = chooseStatus({ missingFields, humanReviewRequired, hasAmbiguousReference });
  const suggestedReply = buildSuggestedReply({
    missingFields,
    hasAmbiguousReference,
    hasPriceRequest,
    hasUnknownProduct,
    hasVagueRequest,
    status,
  });

  return {
    customerName,
    phone,
    pickupDateText,
    pickupTime,
    items,
    missingFields,
    aiConfidence,
    humanReviewRequired,
    suggestedReply,
    status,
    urgency,
  };
}
