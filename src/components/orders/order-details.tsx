import Link from "next/link";
import {
  Ban,
  CheckCircle2,
  ClipboardCheck,
  PackageCheck,
  Pencil,
  Printer,
  ShieldAlert,
  ShoppingBag,
} from "lucide-react";
import { saveOrderDetailsAction, updateOrderStatusAction } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Label, Select, Textarea } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { TableWrap } from "@/components/ui/table";
import { StatusBadge } from "@/components/shared/status-badge";
import { ConfidenceMeter } from "@/components/shared/confidence-meter";
import type { OrderStatus, OrderWithRelations } from "@/lib/types";
import { formatHebrewDate, formatHebrewDateTime } from "@/lib/date-utils";
import { formatPhone } from "@/lib/utils";

const statusActions: Array<{ status: OrderStatus; label: string; icon: typeof CheckCircle2; variant?: "default" | "outline" | "danger" | "success" | "secondary" }> = [
  { status: "approved", label: "אשר הזמנה", icon: CheckCircle2, variant: "success" },
  { status: "in_preparation", label: "סמן בהכנה", icon: ClipboardCheck, variant: "default" },
  { status: "ready", label: "סמן מוכן לאיסוף", icon: PackageCheck, variant: "secondary" },
  { status: "picked_up", label: "סמן נאסף", icon: ShoppingBag, variant: "outline" },
  { status: "cancelled", label: "בטל הזמנה", icon: Ban, variant: "danger" },
];

const units = [
  { value: "kg", label: "ק״ג" },
  { value: "unit", label: "יחידות" },
  { value: "tray", label: "מגשים" },
  { value: "unknown", label: "לא ידוע" },
];

function fieldLabel(field: string) {
  const labels: Record<string, string> = {
    customer_name: "שם לקוח",
    phone: "טלפון",
    pickup_time: "שעת איסוף",
    quantity: "כמות",
    items: "פריטים",
  };
  return labels[field] ?? field;
}

function StatusActionForm({
  orderId,
  status,
  label,
  icon: Icon,
  variant,
}: {
  orderId: string;
  status: OrderStatus;
  label: string;
  icon: typeof CheckCircle2;
  variant?: "default" | "outline" | "danger" | "success" | "secondary";
}) {
  return (
    <form action={updateOrderStatusAction}>
      <input type="hidden" name="order_id" value={orderId} />
      <input type="hidden" name="status" value={status} />
      <Button type="submit" variant={variant} className="w-full justify-center">
        <Icon className="h-4 w-4" aria-hidden="true" />
        {label}
      </Button>
    </form>
  );
}

export function OrderDetails({ order }: { order: OrderWithRelations }) {
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="min-w-0 space-y-6">
        <Card>
          <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-black text-teal-900">הזמנה מובנית</p>
              <CardTitle className="mt-1 text-3xl">{order.order_number}</CardTitle>
              <p className="mt-2 text-sm text-slate-500">
                נוצרה מהודעת וואטסאפ מקורית ונדרשת בדיקה לפני הכנה.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <StatusBadge status={order.status} />
              {order.human_review_required ? (
                <Badge tone="amber" className="gap-1.5">
                  <ShieldAlert className="h-3.5 w-3.5" aria-hidden="true" />
                  בדיקה אנושית
                </Badge>
              ) : null}
            </div>
          </CardHeader>
          <CardContent>
            {order.status === "approved" ? (
              <div className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-950">
                ההזמנה אושרה ידנית. נוצרה הודעת מערכת מדומה ללקוח, אך המחיר הסופי עדיין לפי משקל וזמינות בפועל.
              </div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-bold text-slate-500">לקוח</p>
                <p className="mt-2 text-lg font-black text-slate-950">{order.customer?.name ?? "ללא שם"}</p>
                <p className="mt-1 whitespace-nowrap text-sm font-semibold text-slate-500" dir="ltr">
                  {order.customer?.phone ? formatPhone(order.customer.phone) : "ללא טלפון"}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-bold text-slate-500">איסוף</p>
                <p className="mt-2 text-lg font-black text-teal-950">{order.pickup_time ?? "שעה חסרה"}</p>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  {order.pickup_date_text ?? formatHebrewDate(order.pickup_date)}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-bold text-slate-500">אמון AI</p>
                <div className="mt-3">
                  <ConfidenceMeter value={order.ai_confidence} />
                </div>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-bold text-slate-500">פרטים חסרים</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {order.missing_fields.length > 0 ? (
                    order.missing_fields.map((field) => (
                      <Badge key={field} tone="orange">
                        {fieldLabel(field)}
                      </Badge>
                    ))
                  ) : (
                    <Badge tone="green">אין</Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5 text-teal-900" aria-hidden="true" />
              עריכת הזמנה לפני אישור
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form action={saveOrderDetailsAction} className="space-y-6">
              <input type="hidden" name="order_id" value={order.id} />
              <div className="grid gap-4 md:grid-cols-2">
                <Field>
                  <Label htmlFor="pickup_date_text">תיאור תאריך איסוף</Label>
                  <Input id="pickup_date_text" name="pickup_date_text" defaultValue={order.pickup_date_text ?? ""} />
                </Field>
                <Field>
                  <Label htmlFor="pickup_time">שעת איסוף</Label>
                  <Input id="pickup_time" name="pickup_time" defaultValue={order.pickup_time ?? ""} placeholder="10:30" />
                </Field>
                <Field>
                  <Label htmlFor="missing_fields">פרטים חסרים</Label>
                  <Input
                    id="missing_fields"
                    name="missing_fields"
                    defaultValue={order.missing_fields.join(", ")}
                    placeholder="pickup_time, quantity"
                  />
                </Field>
                <Field className="flex min-h-11 items-center gap-3 rounded-md border border-slate-200 bg-white px-3">
                  <input
                    id="human_review_required"
                    name="human_review_required"
                    type="checkbox"
                    defaultChecked={order.human_review_required}
                    className="h-5 w-5 accent-teal-900"
                  />
                  <Label htmlFor="human_review_required">נדרשת בדיקה אנושית</Label>
                </Field>
              </div>

              <div>
                <Label>פריטים</Label>
                <TableWrap className="mt-2 rounded-lg border border-slate-200">
                  <table className="w-full min-w-[760px] text-right text-sm">
                    <thead className="bg-slate-50 text-xs font-bold text-slate-500">
                      <tr>
                        <th className="px-3 py-3">מוצר</th>
                        <th className="px-3 py-3">כמות</th>
                        <th className="px-3 py-3">יחידה</th>
                        <th className="px-3 py-3">חיתוך</th>
                        <th className="px-3 py-3">הערות</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {[...order.items, null].map((item, index) => (
                        <tr key={item?.id ?? "new"}>
                          <td className="px-3 py-3">
                            <input type="hidden" name="item_id" value={item?.id ?? "new"} />
                            <Input name="product_name" defaultValue={item?.product_name ?? ""} placeholder="פריט נוסף" />
                          </td>
                          <td className="px-3 py-3">
                            <Input
                              name="quantity"
                              type="number"
                              step="0.1"
                              defaultValue={item?.quantity ?? ""}
                              aria-label={`כמות פריט ${index + 1}`}
                            />
                          </td>
                          <td className="px-3 py-3">
                            <Select name="unit" defaultValue={item?.unit ?? "unknown"} aria-label={`יחידה פריט ${index + 1}`}>
                              {units.map((unit) => (
                                <option key={unit.value} value={unit.value}>
                                  {unit.label}
                                </option>
                              ))}
                            </Select>
                          </td>
                          <td className="px-3 py-3">
                            <Input name="cut_style" defaultValue={item?.cut_style ?? ""} placeholder="פילה בלי עור" />
                          </td>
                          <td className="px-3 py-3">
                            <Input name="item_notes" defaultValue={item?.notes ?? ""} placeholder="הערת הכנה" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </TableWrap>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field>
                  <Label htmlFor="notes">הערות פנימיות</Label>
                  <Textarea id="notes" name="notes" defaultValue={order.notes ?? ""} />
                </Field>
                <Field>
                  <Label htmlFor="customer_notes">הערות ללקוח</Label>
                  <Textarea id="customer_notes" name="customer_notes" defaultValue={order.customer_notes ?? ""} />
                </Field>
              </div>

              <Button type="submit" size="lg">
                שמור עריכות
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>הודעות מקוריות ושיחה</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-bold text-slate-500">הודעות מקור שנשמרו לצד ההזמנה</p>
              <ul className="mt-3 space-y-2">
                {order.raw_messages.map((message) => (
                  <li key={message} className="rounded-md bg-white p-3 text-sm leading-6 text-slate-700">
                    {message}
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-2">
              {order.messages.map((message) => (
                <div key={message.id} className="rounded-lg border border-slate-200 bg-white p-3">
                  <div className="mb-1 flex items-center justify-between gap-3 text-xs font-bold text-slate-500">
                    <span>{message.direction === "incoming" ? "לקוח" : "מערכת"}</span>
                    <span>{formatHebrewDateTime(message.timestamp)}</span>
                  </div>
                  <p className="text-sm leading-6 text-slate-800">{message.text}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <aside className="min-w-0 space-y-6">
        <Card className="sticky top-6 print:hidden">
          <CardHeader>
            <CardTitle>פעולות הזמנה</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {statusActions.map((action) => (
              <StatusActionForm key={action.status} orderId={order.id} {...action} />
            ))}
            <Button asChild variant="outline" className="w-full">
              <Link href={`/orders/${order.id}/ticket`}>
                <Printer className="h-4 w-4" aria-hidden="true" />
                הדפס בון
              </Link>
            </Button>
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
