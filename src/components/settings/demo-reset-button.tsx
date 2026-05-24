"use client";

import { useState, useTransition } from "react";
import { RotateCcw } from "lucide-react";
import { resetDemoDataAction } from "@/lib/actions";
import { Button } from "@/components/ui/button";

export function DemoResetButton() {
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleReset() {
    const approved = window.confirm(
      "לאפס את נתוני הדמו? הפעולה תמחק לקוחות, שיחות, הודעות והזמנות דמו ותטען תרחיש נקי להצגה.",
    );
    if (!approved) return;

    startTransition(async () => {
      await resetDemoDataAction();
      setMessage("נתוני הדמו אופסו בהצלחה.");
    });
  }

  return (
    <div className="space-y-3">
      <Button type="button" variant="outline" className="w-full" onClick={handleReset} disabled={isPending}>
        <RotateCcw className="h-4 w-4" aria-hidden="true" />
        {isPending ? "מאפס נתונים..." : "אפס נתוני דמו"}
      </Button>
      {message ? <p className="text-sm font-bold text-teal-900">{message}</p> : null}
    </div>
  );
}
