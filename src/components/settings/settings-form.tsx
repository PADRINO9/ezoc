import { PlugZap, Save, ShieldCheck } from "lucide-react";
import { saveSettingsAction } from "@/lib/actions";
import type { Settings } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Label, Select, Textarea } from "@/components/ui/form";
import { DemoResetButton } from "@/components/settings/demo-reset-button";

export function SettingsForm({ settings }: { settings: Settings }) {
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <Card className="min-w-0">
        <CardHeader>
          <CardTitle>הגדרות חנות</CardTitle>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            הגדרות שנשמרות בבסיס הנתונים ומשפיעות על סף רמת הוודאות, תשובות מערכת וסטטוס ברירת מחדל.
          </p>
        </CardHeader>
        <CardContent>
          <form action={saveSettingsAction} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <Field>
                <Label htmlFor="business_name">שם עסק</Label>
                <Input id="business_name" name="business_name" defaultValue={settings.business_name} />
              </Field>
              <Field>
                  <Label htmlFor="minimum_confidence_threshold">סף רמת ודאות</Label>
                <Input
                  id="minimum_confidence_threshold"
                  name="minimum_confidence_threshold"
                  type="number"
                  min="0"
                  max="100"
                  defaultValue={settings.minimum_confidence_threshold}
                />
              </Field>
              <Field>
                <Label htmlFor="opening_hours_weekdays">שעות פתיחה א-ה</Label>
                <Input
                  id="opening_hours_weekdays"
                  name="opening_hours_weekdays"
                  defaultValue={settings.opening_hours["א-ה"] ?? ""}
                />
              </Field>
              <Field>
                <Label htmlFor="opening_hours_friday">שעות פתיחה שישי</Label>
                <Input
                  id="opening_hours_friday"
                  name="opening_hours_friday"
                  defaultValue={settings.opening_hours["שישי"] ?? ""}
                />
              </Field>
              <Field>
                <Label htmlFor="opening_hours_saturday">שבת</Label>
                <Input
                  id="opening_hours_saturday"
                  name="opening_hours_saturday"
                  defaultValue={settings.opening_hours["שבת"] ?? ""}
                />
              </Field>
              <Field>
                <Label htmlFor="default_ai_order_status">סטטוס ברירת מחדל להזמנות מפוענחות</Label>
                <Select id="default_ai_order_status" name="default_ai_order_status" defaultValue={settings.default_ai_order_status}>
                  <option value="pending_review">ממתין לאישור</option>
                  <option value="missing_details">חסרים פרטים</option>
                  <option value="human_review">דורש בדיקה</option>
                </Select>
              </Field>
            </div>

            <Field>
              <Label htmlFor="pickup_windows">חלונות איסוף</Label>
              <Textarea
                id="pickup_windows"
                name="pickup_windows"
                defaultValue={settings.pickup_windows.join("\n")}
                className="min-h-24"
              />
            </Field>

            <Field>
              <Label htmlFor="after_hours_auto_reply">תשובה אוטומטית מחוץ לשעות פעילות</Label>
              <Textarea
                id="after_hours_auto_reply"
                name="after_hours_auto_reply"
                defaultValue={settings.after_hours_auto_reply}
              />
            </Field>

            <Field className="flex min-h-11 items-center gap-3 rounded-md border border-slate-200 bg-white px-3">
              <input
                id="require_human_approval"
                name="require_human_approval"
                type="checkbox"
                defaultChecked={settings.require_human_approval}
                className="h-5 w-5 accent-teal-900"
              />
              <Label htmlFor="require_human_approval">חייב אישור אנושי לפני אישור סופי</Label>
            </Field>

            <Button type="submit" size="lg">
              <Save className="h-5 w-5" aria-hidden="true" />
              שמור הגדרות
            </Button>
          </form>
        </CardContent>
      </Card>

      <aside className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-teal-900" aria-hidden="true" />
              כלל בטיחות עסקי
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-7 text-slate-600">
              המערכת יכולה ליצור טיוטה, לשאול שאלות ולסמן עדיפויות. אישור סופי להכנה מתבצע רק
              בלחיצה ידנית של משתמש מהחנות.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PlugZap className="h-5 w-5 text-teal-900" aria-hidden="true" />
              סטטוס אינטגרציות
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3">
              <span className="font-bold">Supabase</span>
              <Badge tone="green">מוכן לחיבור</Badge>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3">
              <span className="font-bold">WhatsApp Business API</span>
              <Badge tone="blue">Webhook מוכן</Badge>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3">
              <span className="font-bold">מנוע פענוח עתידי</span>
              <Badge tone="neutral">הפרדה מוכנה</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>הכנה להצגת לקוח</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm leading-6 text-slate-600">
              איפוס בטוח של לקוחות, שיחות, הודעות והזמנות דמו. קטלוג מוצרים והגדרות נשארים במקום.
            </p>
            <DemoResetButton />
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
