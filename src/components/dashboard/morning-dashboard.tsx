import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpLeft,
  CheckCircle2,
  Clock3,
  Eye,
  MessageSquareWarning,
  PackageCheck,
  Printer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { ConfidenceMeter } from "@/components/shared/confidence-meter";
import { Table, TableWrap, TBody, Td, Th, THead, Tr } from "@/components/ui/table";
import {
  comparePickupTime,
  formatHebrewDate,
  formatHebrewDateTime,
  isEarlyPickup,
  isOrderReceivedOvernight,
} from "@/lib/date-utils";
import { itemSummary, recommendedActionForStatus } from "@/lib/order-format";
import type { DashboardData, OrderStatus, OrderWithRelations } from "@/lib/types";
import { formatPhone } from "@/lib/utils";

const summaryItems: Array<{
  label: string;
  statuses: OrderStatus[];
  icon: typeof Clock3;
}> = [
  { label: "מוכנות לאישור", statuses: ["pending_review"], icon: CheckCircle2 },
  { label: "חסרות פרטים", statuses: ["missing_details"], icon: MessageSquareWarning },
  { label: "דורשות בדיקה", statuses: ["human_review"], icon: AlertTriangle },
  { label: "בהכנה", statuses: ["in_preparation"], icon: Clock3 },
  { label: "מוכנות לאיסוף", statuses: ["ready"], icon: PackageCheck },
  { label: "נאספו היום", statuses: ["picked_up"], icon: CheckCircle2 },
];

function priorityReasons(order: OrderWithRelations) {
  const reasons: string[] = [];
  if (order.human_review_required) reasons.push("דורש בדיקה");
  if (order.missing_fields.length > 0) reasons.push("חסרים פרטים");
  if (isEarlyPickup(order.pickup_time)) reasons.push("איסוף מוקדם");
  if (order.ai_confidence < 85) reasons.push("רמת ודאות נמוכה");
  if (order.raw_messages.some((message) => /כמו|כרגיל|פעם שעברה|תמיד/.test(message))) {
    reasons.push("מתייחס להזמנה קודמת");
  }
  return reasons;
}

function receivedOvernight(order: OrderWithRelations) {
  return isOrderReceivedOvernight(
    order.created_at,
    order.messages.filter((message) => message.direction === "incoming").map((message) => message.timestamp),
  );
}

function SummaryCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: typeof Clock3;
}) {
  return (
    <Card className="min-h-32">
      <CardContent className="flex h-full items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-slate-500">{label}</p>
          <p className="mt-3 text-4xl font-black text-slate-950">{value}</p>
        </div>
        <span className="grid h-12 w-12 place-items-center rounded-lg bg-teal-50 text-teal-950">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
      </CardContent>
    </Card>
  );
}

function PriorityCard({ order }: { order: OrderWithRelations }) {
  const reasons = priorityReasons(order);
  const wasReceivedOvernight = receivedOvernight(order);

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-black text-slate-950">{order.customer?.name ?? "לקוח ללא שם"}</p>
          <p className="mt-1 text-sm font-semibold text-slate-600">{order.order_number}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>
      <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-700">{itemSummary(order)}</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {wasReceivedOvernight ? <Badge tone="blue">התקבלה בלילה</Badge> : null}
        {reasons.map((reason) => (
          <Badge key={reason} tone={reason === "איסוף מוקדם" ? "blue" : "amber"}>
            {reason}
          </Badge>
        ))}
      </div>
      <p className="mt-3 text-sm font-black text-teal-950">
        פעולה מומלצת: {recommendedActionForStatus(order.status)}
      </p>
      <div className="mt-4 flex items-center justify-between gap-3">
        <span className="text-sm font-black text-teal-950">{order.pickup_time ?? "שעה חסרה"}</span>
        <Button asChild variant="outline" size="sm">
          <Link href={`/orders/${order.id}`}>
            <Eye className="h-4 w-4" aria-hidden="true" />
            בדיקה
          </Link>
        </Button>
      </div>
    </div>
  );
}

export function MorningDashboard({ data }: { data: DashboardData }) {
  const todayOrders = [...data.orders].sort((a, b) => comparePickupTime(a.pickup_time, b.pickup_time));
  const newNightOrders = data.orders.filter(
    (order) =>
      receivedOvernight(order) &&
      ["pending_review", "missing_details", "human_review"].includes(order.status),
  );
  const priorityOrders = todayOrders
    .filter((order) => priorityReasons(order).length > 0)
    .slice(0, 4);

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 rounded-xl border border-teal-900/10 bg-white p-6 shadow-[0_18px_60px_-45px_rgba(13,94,99,0.65)] lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-black text-teal-900">תמונת בוקר</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 lg:text-5xl">
            בוקר טוב — יש {newNightOrders.length} הזמנות חדשות מהלילה
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
            כל הודעות הוואטסאפ נקלטו, פוענחו ונכנסו לרשימת עבודה מסודרת. אף הזמנה לא מאושרת
            בלי פעולה ידנית של החנות.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="lg">
            <Link href="/inbox">
              <MessageSquareWarning className="h-5 w-5" aria-hidden="true" />
              סימולטור הודעות
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/orders">
              <ArrowUpLeft className="h-5 w-5" aria-hidden="true" />
              כל ההזמנות
            </Link>
          </Button>
        </div>
      </div>

      {data.persistenceMode === "demo" ? (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950">
          מצב הדגמה פעיל כי מפתחות Supabase לא הוגדרו. שכבת Supabase, schema ו-seed קיימים ומוכנים לחיבור.
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6" aria-label="סיכום סטטוסים">
        {summaryItems.map((item) => (
          <SummaryCard
            key={item.label}
            label={item.label}
            icon={item.icon}
            value={data.orders.filter((order) => item.statuses.includes(order.status)).length}
          />
        ))}
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)]">
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>עדיפויות לטיפול עכשיו</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {priorityOrders.length > 0 ? (
              priorityOrders.map((order) => <PriorityCard key={order.id} order={order} />)
            ) : (
              <div className="rounded-lg border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                אין כרגע הזמנות חריגות. הרשימה נקייה ומוכנה לסריקה.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div>
              <CardTitle>הזמנות היום לפי שעת איסוף</CardTitle>
              <p className="mt-1 text-sm text-slate-500">סריקה מהירה לפני פתיחת החנות</p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/orders">
                <Printer className="h-4 w-4" aria-hidden="true" />
                טבלת עבודה
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <TableWrap>
              <Table>
                <THead>
                  <Tr>
                    <Th>הזמנה</Th>
                    <Th>לקוח</Th>
                    <Th>איסוף</Th>
                    <Th>פריטים</Th>
                    <Th>סטטוס</Th>
                    <Th>רמת ודאות</Th>
                    <Th>פעולה מומלצת</Th>
                    <Th>פתיחה</Th>
                  </Tr>
                </THead>
                <TBody>
                  {todayOrders.map((order) => {
                    const wasReceivedOvernight = receivedOvernight(order);

                    return (
                      <Tr key={order.id} className={order.human_review_required ? "bg-amber-50/50" : undefined}>
                        <Td className="font-black text-slate-950">{order.order_number}</Td>
                        <Td>
                          <div className="font-bold text-slate-950">{order.customer?.name ?? "לקוח ללא שם"}</div>
                          <div className="mt-1 text-xs font-semibold text-slate-500" dir="ltr">
                            {order.customer?.phone ? formatPhone(order.customer.phone) : "ללא טלפון"}
                          </div>
                        </Td>
                        <Td>
                          <div className="text-lg font-black text-teal-950">{order.pickup_time ?? "חסר"}</div>
                          <div className="text-xs font-semibold text-slate-500">
                            {formatHebrewDate(order.pickup_date)}
                          </div>
                        </Td>
                        <Td className="max-w-sm">
                          <p className="line-clamp-2 leading-6">{itemSummary(order)}</p>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {wasReceivedOvernight ? <Badge tone="blue">התקבלה בלילה</Badge> : null}
                            {order.missing_fields.length > 0 ? <Badge tone="orange">חסרים פרטים</Badge> : null}
                            {order.human_review_required ? <Badge tone="amber">דורש בדיקה</Badge> : null}
                          </div>
                          {order.created_at ? (
                            <p className="mt-1 text-xs text-slate-400">נקלט {formatHebrewDateTime(order.created_at)}</p>
                          ) : null}
                        </Td>
                        <Td>
                          <StatusBadge status={order.status} />
                        </Td>
                        <Td>
                          <ConfidenceMeter value={order.ai_confidence} compact />
                        </Td>
                        <Td>
                          <span className="text-sm font-black text-teal-950">
                            {recommendedActionForStatus(order.status)}
                          </span>
                        </Td>
                        <Td>
                          <Button asChild variant="outline" size="sm">
                            <Link href={`/orders/${order.id}`}>פתח</Link>
                          </Button>
                        </Td>
                      </Tr>
                    );
                  })}
                </TBody>
              </Table>
            </TableWrap>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
