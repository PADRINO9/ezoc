"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AlertTriangle, ArrowUpDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/form";
import { Table, TableWrap, TBody, Td, Th, THead, Tr } from "@/components/ui/table";
import { StatusBadge } from "@/components/shared/status-badge";
import { ConfidenceMeter } from "@/components/shared/confidence-meter";
import type { OrderStatus, OrderWithRelations } from "@/lib/types";
import { comparePickupTime, formatHebrewDate, isEarlyPickup, isOrderReceivedOvernight } from "@/lib/date-utils";
import { itemSummary, printStatusLabel, recommendedActionForStatus } from "@/lib/order-format";
import { statusLabels } from "@/lib/status-utils";
import { cn, formatPhone } from "@/lib/utils";

const statuses: Array<OrderStatus | "all"> = [
  "all",
  "draft_from_whatsapp",
  "missing_details",
  "human_review",
  "pending_review",
  "approved",
  "in_preparation",
  "ready",
  "picked_up",
  "cancelled",
];

export function OrdersTable({ orders }: { orders: OrderWithRelations[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<OrderStatus | "all">("all");
  const [pickupDate, setPickupDate] = useState("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const filteredOrders = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return [...orders]
      .filter((order) => {
        const customerName = order.customer?.name ?? "";
        const phone = order.customer?.phone ?? "";
        const matchesQuery =
          !normalizedQuery ||
          customerName.toLowerCase().includes(normalizedQuery) ||
          phone.includes(normalizedQuery.replace(/[^\d]/g, "")) ||
          order.order_number.toLowerCase().includes(normalizedQuery);
        const matchesStatus = status === "all" || order.status === status;
        const matchesPickupDate = !pickupDate || order.pickup_date === pickupDate;
        return matchesQuery && matchesStatus && matchesPickupDate;
      })
      .sort((a, b) => {
        const result = comparePickupTime(a.pickup_time, b.pickup_time);
        return sortDirection === "asc" ? result : -result;
      });
  }, [orders, pickupDate, query, sortDirection, status]);

  return (
    <Card>
      <CardHeader className="gap-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle>טבלת הזמנות תפעולית</CardTitle>
            <p className="mt-1 text-sm text-slate-500">חיפוש, סינון וסידור לפי זמן איסוף</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative">
              <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="חיפוש שם, טלפון או מספר הזמנה"
                className="pr-9 sm:w-72"
              />
            </div>
            <Select value={status} onChange={(event) => setStatus(event.target.value as OrderStatus | "all")}>
              {statuses.map((item) => (
                <option key={item} value={item}>
                  {item === "all" ? "כל הסטטוסים" : statusLabels[item]}
                </option>
              ))}
            </Select>
            <Input
              type="date"
              value={pickupDate}
              onChange={(event) => setPickupDate(event.target.value)}
              className="sm:w-44"
            />
            <Button
              variant="outline"
              onClick={() => setSortDirection((current) => (current === "asc" ? "desc" : "asc"))}
            >
              <ArrowUpDown className="h-4 w-4" aria-hidden="true" />
              זמן איסוף
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <TableWrap>
          <Table>
            <THead>
              <Tr>
                <Th>מספר</Th>
                <Th>לקוח</Th>
                <Th>איסוף</Th>
                <Th>פריטים</Th>
                <Th>סטטוס</Th>
                <Th>רמת ודאות</Th>
                <Th>בדיקה</Th>
                <Th>בון</Th>
                <Th>נוצר</Th>
                <Th>פעולה מומלצת</Th>
                <Th>פתיחה</Th>
              </Tr>
            </THead>
            <TBody>
              {filteredOrders.map((order) => {
                const isLowConfidence = order.ai_confidence < 85;
                const isMissing = order.missing_fields.length > 0;
                const isUrgent = order.urgency === "urgent" || isEarlyPickup(order.pickup_time);
                const receivedOvernight = isOrderReceivedOvernight(
                  order.created_at,
                  order.messages.filter((message) => message.direction === "incoming").map((message) => message.timestamp),
                );

                return (
                  <Tr
                    key={order.id}
                    className={cn(
                      order.human_review_required && "bg-amber-50/45",
                      isMissing && "shadow-[inset_-4px_0_0_#f97316]",
                      isLowConfidence && "shadow-[inset_-4px_0_0_#dc2626]",
                    )}
                  >
                    <Td className="font-black text-slate-950">{order.order_number}</Td>
                    <Td>
                      <div className="font-bold text-slate-950">{order.customer?.name ?? "לקוח ללא שם"}</div>
                      <div className="mt-1 text-xs font-semibold text-slate-500" dir="ltr">
                        {order.customer?.phone ? formatPhone(order.customer.phone) : "ללא טלפון"}
                      </div>
                    </Td>
                    <Td>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-black text-teal-950">{order.pickup_time ?? "חסר"}</span>
                        {isUrgent ? <AlertTriangle className="h-4 w-4 text-amber-600" aria-label="דחוף" /> : null}
                      </div>
                      <div className="text-xs font-semibold text-slate-500">
                        {order.pickup_date_text ?? formatHebrewDate(order.pickup_date)}
                      </div>
                    </Td>
                    <Td className="max-w-md">
                      <p className="line-clamp-2 leading-6">{itemSummary(order)}</p>
                      {order.missing_fields.length > 0 ? (
                        <p className="mt-1 text-xs font-bold text-orange-700">חסרים: {order.missing_fields.join(", ")}</p>
                      ) : null}
                      {receivedOvernight ? (
                        <Badge tone="blue" className="mt-2">
                          התקבלה בלילה
                        </Badge>
                      ) : null}
                    </Td>
                    <Td>
                      <StatusBadge status={order.status} />
                    </Td>
                    <Td>
                      <ConfidenceMeter value={order.ai_confidence} compact />
                    </Td>
                    <Td className="font-bold">
                      {order.human_review_required ? "דורש בדיקה" : "רגיל"}
                    </Td>
                    <Td>
                      <Badge tone={order.printed_at ? "green" : "neutral"}>{printStatusLabel(order.printed_at)}</Badge>
                    </Td>
                    <Td className="text-xs text-slate-500">
                      {new Intl.DateTimeFormat("he-IL", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" }).format(new Date(order.created_at))}
                    </Td>
                    <Td>
                      <span className="text-sm font-black text-teal-950">{recommendedActionForStatus(order.status)}</span>
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
        {filteredOrders.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">לא נמצאו הזמנות לפי הסינון הנוכחי.</div>
        ) : null}
      </CardContent>
    </Card>
  );
}
