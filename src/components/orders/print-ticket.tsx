"use client";

import { useState, useTransition } from "react";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { markOrderPrintedAction } from "@/lib/actions";
import type { OrderWithRelations, Settings } from "@/lib/types";
import { formatHebrewDate, formatHebrewDateTime } from "@/lib/date-utils";
import { formatQuantity, printStatusLabel, unitLabel } from "@/lib/order-format";
import { getStatusLabel } from "@/lib/status-utils";
import { formatPhone } from "@/lib/utils";

export function PrintTicket({ order, settings }: { order: OrderWithRelations; settings: Settings }) {
  const [isPending, startTransition] = useTransition();
  const [printedAt, setPrintedAt] = useState(order.printed_at);

  function handlePrint() {
    startTransition(async () => {
      await markOrderPrintedAction(order.id);
      setPrintedAt(new Date().toISOString());
      window.print();
    });
  }

  return (
    <div className="mx-auto max-w-[520px]">
      <div className="no-print mb-5 flex items-center justify-between gap-3">
        <Button onClick={handlePrint} size="lg" disabled={isPending}>
          <Printer className="h-5 w-5" aria-hidden="true" />
          {isPending ? "מסמן כהודפס..." : "הדפס בון"}
        </Button>
        <p className="text-sm font-semibold text-slate-500">תצוגה קומפקטית להדפסה</p>
      </div>

      <article className="print-ticket-page rounded-lg border border-slate-300 bg-white p-7 text-slate-950 shadow-sm">
        <header className="border-b-2 border-slate-950 pb-4 text-center">
          <p className="text-sm font-black">{settings.business_name}</p>
          <h1 className="mt-2 text-3xl font-black">הזמנה #{order.order_number.replace(/\D/g, "")}</h1>
        </header>

        <section className="mt-5 space-y-2 border-b border-slate-200 pb-5 text-base">
          <p>
            <strong>לקוח:</strong> {order.customer?.name ?? "ללא שם"}
          </p>
          <p dir="rtl">
            <strong>טלפון:</strong> <span dir="ltr">{order.customer?.phone ? formatPhone(order.customer.phone) : "ללא טלפון"}</span>
          </p>
          <p>
            <strong>איסוף:</strong> {order.pickup_date_text ?? formatHebrewDate(order.pickup_date)}{" "}
            {order.pickup_time ?? "שעה חסרה"}
          </p>
          <p>
            <strong>הדפסה:</strong> {printStatusLabel(printedAt)}
          </p>
        </section>

        <section className="mt-5">
          <h2 className="text-lg font-black">פריטים:</h2>
          <ol className="mt-3 list-decimal space-y-5 pr-5">
            {order.items.map((item) => (
              <li key={item.id} className="border-b border-dashed border-slate-300 pb-4 last:border-0">
                <p className="text-lg font-black">
                  {item.product_name} — {formatQuantity(item.quantity, item.unit)}
                </p>
                {item.cut_style ? <p className="mt-1">חיתוך: {item.cut_style}</p> : null}
                <p className="mt-1">יחידה: {unitLabel(item.unit, item.quantity)}</p>
                {item.notes ? <p className="mt-1">הערה: {item.notes}</p> : null}
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-5 border-t border-slate-200 pt-4">
          <h2 className="font-black">הערות:</h2>
          <p className="mt-2 min-h-8 text-sm leading-6">{order.notes || order.customer_notes || "אין הערות"}</p>
        </section>

        <footer className="mt-5 border-t-2 border-slate-950 pt-4 text-sm">
          <p>
            <strong>סטטוס:</strong> {getStatusLabel(order.status)}
          </p>
          <p className="mt-1">
            <strong>נוצר:</strong> {formatHebrewDateTime(order.created_at)}
          </p>
          <p className="mt-3 text-xs font-bold text-slate-500">
            מחיר, זמינות ומשקל סופי נקבעים רק באישור החנות.
          </p>
        </footer>
      </article>
    </div>
  );
}
