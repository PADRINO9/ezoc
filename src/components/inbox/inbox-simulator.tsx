"use client";

import { useMemo, useState } from "react";
import { Bot, Clock3, MessageCircle, Send, UserRound } from "lucide-react";
import { simulateIncomingMessageAction } from "@/lib/actions";
import type { ConversationWithRelations } from "@/lib/types";
import { sampleMessages } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Label, Textarea } from "@/components/ui/form";
import { StatusBadge } from "@/components/shared/status-badge";
import { ConfidenceMeter } from "@/components/shared/confidence-meter";
import { Badge } from "@/components/ui/badge";
import { formatHebrewDateTime } from "@/lib/date-utils";
import { cn, formatPhone } from "@/lib/utils";

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

function ConversationList({
  conversations,
  selectedId,
  onSelect,
}: {
  conversations: ConversationWithRelations[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="space-y-2">
      {conversations.map((conversation) => {
        const latest = conversation.messages.at(-1);
        const order = conversation.orders.at(-1);
        const isSelected = selectedId === conversation.id;

        return (
          <button
            key={conversation.id}
            type="button"
            onClick={() => onSelect(conversation.id)}
            className={cn(
              "w-full rounded-lg border p-4 text-right transition",
              isSelected
                ? "border-teal-900 bg-teal-50 shadow-sm"
                : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50",
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-black text-slate-950">{conversation.customer?.name ?? "לקוח ללא שם"}</p>
                <p className="mt-1 text-xs font-semibold text-slate-500" dir="ltr">
                  {formatPhone(conversation.phone)}
                </p>
              </div>
              {order ? <StatusBadge status={order.status} /> : <Badge>שיחה</Badge>}
            </div>
            {latest ? <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">{latest.text}</p> : null}
          </button>
        );
      })}
    </div>
  );
}

function ChatPanel({ conversation }: { conversation: ConversationWithRelations | null }) {
  if (!conversation) {
    return (
      <Card className="min-h-[560px]">
        <CardContent className="grid min-h-[560px] place-items-center text-center">
          <div>
            <MessageCircle className="mx-auto h-10 w-10 text-slate-300" aria-hidden="true" />
            <p className="mt-4 font-bold text-slate-700">בחר שיחה להצגת היסטוריית ההודעות</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const linkedOrder = conversation.orders.at(-1) ?? null;

  return (
    <Card className="min-h-[560px] overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between gap-4 bg-slate-50/70">
        <div>
          <CardTitle>{conversation.customer?.name ?? "לקוח ללא שם"}</CardTitle>
          <p className="mt-1 text-sm font-semibold text-slate-500" dir="ltr">
            {formatPhone(conversation.phone)}
          </p>
        </div>
        {linkedOrder ? <StatusBadge status={linkedOrder.status} /> : null}
      </CardHeader>
      <CardContent className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <div className="space-y-3 rounded-lg border border-slate-100 bg-[#f9f7f1] p-4">
          {conversation.messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex",
                message.direction === "incoming" ? "justify-start" : "justify-end",
              )}
            >
              <div
                className={cn(
                  "max-w-[78%] rounded-lg border px-4 py-3 shadow-sm",
                  message.direction === "incoming"
                    ? "border-slate-200 bg-white text-slate-950"
                    : "border-teal-900/10 bg-teal-950 text-white",
                )}
              >
                <div className="mb-2 flex items-center gap-2 text-xs font-bold opacity-75">
                  {message.direction === "incoming" ? (
                    <UserRound className="h-3.5 w-3.5" aria-hidden="true" />
                  ) : (
                    <Bot className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                  {message.direction === "incoming" ? "לקוח" : "מערכת"}
                  <span>{formatHebrewDateTime(message.timestamp)}</span>
                </div>
                <p className="whitespace-pre-wrap text-sm leading-6">{message.text}</p>
              </div>
            </div>
          ))}
        </div>

        <aside className="space-y-4">
          {linkedOrder ? (
            <>
              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <p className="text-sm font-bold text-slate-500">הזמנה מקושרת</p>
                <p className="mt-2 text-2xl font-black text-slate-950">{linkedOrder.order_number}</p>
                <div className="mt-3">
                  <ConfidenceMeter value={linkedOrder.ai_confidence} />
                </div>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <p className="text-sm font-bold text-slate-500">פרטים חסרים</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {linkedOrder.missing_fields.length > 0 ? (
                    linkedOrder.missing_fields.map((field) => <Badge key={field} tone="orange">{fieldLabel(field)}</Badge>)
                  ) : (
                    <Badge tone="green">אין פרטים חסרים</Badge>
                  )}
                </div>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <p className="text-sm font-bold text-slate-500">בדיקה אנושית</p>
                <p className="mt-2 text-base font-black text-slate-950">
                  {linkedOrder.human_review_required ? "נדרשת לפני אישור" : "לא סומנה חריגה"}
                </p>
              </div>
            </>
          ) : (
            <div className="rounded-lg border border-dashed border-slate-200 p-5 text-sm leading-6 text-slate-500">
              עדיין לא נוצרה הזמנה מקושרת לשיחה זו.
            </div>
          )}
        </aside>
      </CardContent>
    </Card>
  );
}

export function InboxSimulator({ conversations }: { conversations: ConversationWithRelations[] }) {
  const sortedConversations = useMemo(
    () => [...conversations].sort((a, b) => b.updated_at.localeCompare(a.updated_at)),
    [conversations],
  );
  const [selectedId, setSelectedId] = useState(sortedConversations[0]?.id ?? null);
  const [name, setName] = useState(sampleMessages[0].name);
  const [phone, setPhone] = useState(sampleMessages[0].phone);
  const [text, setText] = useState(sampleMessages[0].text);
  const selected = sortedConversations.find((conversation) => conversation.id === selectedId) ?? null;

  return (
    <div className="grid gap-6 xl:grid-cols-[390px_minmax(0,1fr)]">
      <div className="min-w-0 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>סימולטור הודעת וואטסאפ נכנסת</CardTitle>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              מדמה webhook עתידי: שמירת הודעה, זיהוי לקוח, parsing, יצירת הזמנה ותשובת מערכת.
            </p>
          </CardHeader>
          <CardContent>
            <form action={simulateIncomingMessageAction} className="space-y-4">
              <input type="hidden" name="timestamp" value={new Date().toISOString()} />
              <Field>
                <Label htmlFor="name">שם מוצג</Label>
                <Input id="name" name="name" value={name} onChange={(event) => setName(event.target.value)} />
              </Field>
              <Field>
                <Label htmlFor="phone">טלפון</Label>
                <Input
                  id="phone"
                  name="phone"
                  dir="ltr"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                />
              </Field>
              <Field>
                <Label htmlFor="text">טקסט הודעה</Label>
                <Textarea
                  id="text"
                  name="text"
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                />
              </Field>
              <Button type="submit" size="lg" className="w-full">
                <Send className="h-5 w-5" aria-hidden="true" />
                שלח הודעה לסימולטור
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>הודעות לדוגמה</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {sampleMessages.map((sample, index) => (
              <button
                key={sample.text}
                type="button"
                onClick={() => {
                  setName(sample.name);
                  setPhone(sample.phone);
                  setText(sample.text);
                }}
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-right text-sm leading-6 transition hover:border-teal-900 hover:bg-teal-50"
              >
                <span className="mb-1 flex items-center gap-2 text-xs font-black text-teal-900">
                  <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                  תרחיש {index + 1}
                </span>
                {sample.text}
              </button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>שיחות פעילות</CardTitle>
          </CardHeader>
          <CardContent>
            <ConversationList
              conversations={sortedConversations}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          </CardContent>
        </Card>
      </div>

      <ChatPanel conversation={selected} />
    </div>
  );
}
