import Image from "next/image";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  BookOpenCheck,
  CheckCircle2,
  ClipboardList,
  Clock3,
  MessageSquareText,
  PackageCheck,
  Pencil,
  Printer,
  Search,
  Send,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Shot = "dashboard" | "inbox" | "orders" | "order-details" | "ticket" | "catalog" | "settings";

interface Marker {
  n: string;
  x: number;
  y: number;
}

interface ScreenGuide {
  id: Shot;
  title: string;
  goal: string;
  markers: Marker[];
  notes: Array<{
    n: string;
    title: string;
    text: string;
  }>;
  bestPractice: string;
}

const dailyFlow = [
  {
    title: "פותחים דשבורד",
    text: "בודקים כמה הזמנות חדשות הגיעו ומה דורש טיפול קודם.",
    icon: Clock3,
  },
  {
    title: "מטפלים בחריגים",
    text: "קודם חסרים פרטים, רמת ודאות נמוכה, מחיר, או ״כמו פעם שעברה״.",
    icon: AlertTriangle,
  },
  {
    title: "פותחים הזמנה",
    text: "בודקים הודעת מקור, פריטים, שעת איסוף והערות.",
    icon: ClipboardList,
  },
  {
    title: "מאשרים ידנית",
    text: "רק בעל החנות או עובד מאשר הופך טיוטה להזמנה מאושרת.",
    icon: ShieldCheck,
  },
  {
    title: "מדפיסים ומכינים",
    text: "מדפיסים בון, מעבירים להכנה ומסמנים מוכן לאיסוף.",
    icon: Printer,
  },
];

const screens: ScreenGuide[] = [
  {
    id: "dashboard",
    title: "1. דשבורד בוקר",
    goal: "זה המסך הראשון שפותחים בבוקר. הוא מחליף גלילה ידנית בעשרות שיחות וואטסאפ.",
    markers: [
      { n: "1", x: 56, y: 20 },
      { n: "2", x: 54, y: 57 },
      { n: "3", x: 83, y: 80 },
    ],
    notes: [
      {
        n: "1",
        title: "כמה הזמנות הגיעו מהלילה",
        text: "מספר שמראה מיד את עומס הבוקר.",
      },
      {
        n: "2",
        title: "כרטיסי מצב",
        text: "כמה מוכנות לאישור, כמה חסרות פרטים וכמה דורשות בדיקה.",
      },
      {
        n: "3",
        title: "עדיפויות",
        text: "התחל מכאן. אלה הזמנות עם סיכון תפעולי או איסוף מוקדם.",
      },
    ],
    bestPractice: "בבוקר מתחילים תמיד מ״דורשות בדיקה״ ו״חסרות פרטים״, ורק אחר כך עוברים להזמנות הרגילות.",
  },
  {
    id: "inbox",
    title: "2. סימולטור וואטסאפ",
    goal: "כאן מדמים הודעות לקוח עד שיהיה חיבור WhatsApp Business API אמיתי.",
    markers: [
      { n: "1", x: 80, y: 31 },
      { n: "2", x: 79, y: 68 },
      { n: "3", x: 36, y: 42 },
    ],
    notes: [
      {
        n: "1",
        title: "הזנת הודעה",
        text: "שם, טלפון וטקסט כמו שהלקוח היה שולח בוואטסאפ.",
      },
      {
        n: "2",
        title: "תרחישים מוכנים",
        text: "לחץ על תרחיש כדי לבדוק מקרה נפוץ: מחיר, שעה חסרה, הזמנה קודמת ועוד.",
      },
      {
        n: "3",
        title: "שיחה ותשובת מערכת",
        text: "רואים מה הלקוח כתב, מה המערכת ענתה, והאם נוצרה הזמנה.",
      },
    ],
    bestPractice: "כדי להדגים ללקוח עסקי, בחר תרחיש 1 להזמנה ברורה ואז תרחיש 2 או 4 כדי להראות טיפול בבעיה.",
  },
  {
    id: "orders",
    title: "3. טבלת הזמנות",
    goal: "זה מסך העבודה לאורך היום. משתמשים בו לחיפוש, סינון ומעבר מהיר להזמנה.",
    markers: [
      { n: "1", x: 57, y: 28 },
      { n: "2", x: 28, y: 28 },
      { n: "3", x: 49, y: 58 },
    ],
    notes: [
      {
        n: "1",
        title: "חיפוש",
        text: "שם לקוח, טלפון או מספר הזמנה. שימושי כשהלקוח הגיע לדלפק.",
      },
      {
        n: "2",
        title: "סינון",
        text: "סנן לפי סטטוס או תאריך, וסדר לפי שעת איסוף.",
      },
      {
        n: "3",
        title: "כפתור ״פתח״",
        text: "פותח את פרטי ההזמנה כדי לערוך, לאשר או להדפיס.",
      },
    ],
    bestPractice: "ביום עמוס מיין לפי זמן איסוף, ואז עבוד מלמעלה למטה.",
  },
  {
    id: "order-details",
    title: "4. פרטי הזמנה",
    goal: "כאן מאשרים בפועל. זה המסך החשוב ביותר לפני הכנה.",
    markers: [
      { n: "1", x: 19, y: 45 },
      { n: "2", x: 56, y: 46 },
      { n: "3", x: 64, y: 78 },
    ],
    notes: [
      {
        n: "1",
        title: "פעולות הזמנה",
        text: "אשר הזמנה, סמן בהכנה, מוכן לאיסוף, נאסף, ביטול והדפסה.",
      },
      {
        n: "2",
        title: "בדיקת פענוח",
        text: "רמת ודאות נמוכה או פרטים חסרים אומרים שצריך לבדוק לפני אישור.",
      },
      {
        n: "3",
        title: "עריכה",
        text: "מתקנים שעה, כמויות, חיתוך והערות. ואז שומרים ומאשרים.",
      },
    ],
    bestPractice: "לא לוחצים ״אשר הזמנה״ לפני ששעת איסוף, כמות ופריטים ברורים.",
  },
  {
    id: "ticket",
    title: "5. בון הכנה",
    goal: "בון קומפקטי לצוות ההכנה. מיועד להדפסה, לא לניהול.",
    markers: [
      { n: "1", x: 54, y: 22 },
      { n: "2", x: 50, y: 55 },
      { n: "3", x: 49, y: 88 },
    ],
    notes: [
      {
        n: "1",
        title: "הדפס בון",
        text: "פותח הדפסה ומסתיר ניווט מיותר.",
      },
      {
        n: "2",
        title: "פריטי הכנה",
        text: "הצוות רואה מוצר, כמות, יחידה, חיתוך והערות.",
      },
      {
        n: "3",
        title: "תזכורת מחיר",
        text: "הבון לא מבטיח מחיר או זמינות סופיים.",
      },
    ],
    bestPractice: "מדפיסים רק אחרי אישור אנושי, ואז מסמנים את ההזמנה ״בהכנה״.",
  },
  {
    id: "catalog",
    title: "6. קטלוג מוצרים",
    goal: "הקטלוג עוזר למערכת לזהות איך לקוחות קוראים למוצרים.",
    markers: [
      { n: "1", x: 76, y: 43 },
      { n: "2", x: 54, y: 43 },
      { n: "3", x: 20, y: 45 },
    ],
    notes: [
      {
        n: "1",
        title: "שם מוצר",
        text: "השם התקני שיופיע בהזמנה.",
      },
      {
        n: "2",
        title: "כינויים",
        text: "מילים שהלקוחות כותבים: סלומון, tuna, דניסים וכו׳.",
      },
      {
        n: "3",
        title: "מוצר חדש",
        text: "מוסיפים מוצר או מנת דגים חדשה בלי לשנות את הקוד.",
      },
    ],
    bestPractice: "אם לקוחות משתמשים במילה שחוזרת הרבה ולא מזוהה, הוסף אותה ככינוי בקטלוג.",
  },
  {
    id: "settings",
    title: "7. הגדרות",
    goal: "הגדרות עסקיות שמשפיעות על תשובות המערכת וסף הבדיקה האנושית.",
    markers: [
      { n: "1", x: 51, y: 33 },
      { n: "2", x: 61, y: 70 },
      { n: "3", x: 20, y: 55 },
    ],
    notes: [
      {
        n: "1",
        title: "סף רמת ודאות",
        text: "מתחת לסף הזה ההזמנה תסומן לבדיקה אנושית.",
      },
      {
        n: "2",
        title: "תשובה אחרי שעות",
        text: "מה הלקוח מקבל כשהוא כותב בלילה או כשהחנות סגורה.",
      },
      {
        n: "3",
        title: "סטטוס אינטגרציות",
        text: "מראה מה מוכן לחיבור עתידי: Supabase, WhatsApp ומנוע פענוח מתקדם.",
      },
    ],
    bestPractice: "בחנות אמיתית השאר ״חייב אישור אנושי״ פעיל תמיד.",
  },
];

const buttonGuide = [
  {
    button: "סימולטור הודעות",
    where: "דשבורד",
    meaning: "פותח מסך שליחת הודעות דמה, כדי לבדוק איך המערכת מבינה הזמנות.",
    icon: MessageSquareText,
  },
  {
    button: "שלח הודעה לסימולטור",
    where: "הודעות וואטסאפ",
    meaning: "שומר הודעה, מפעיל פענוח, יוצר הזמנה ותשובת מערכת.",
    icon: Send,
  },
  {
    button: "פתח / בדיקה",
    where: "דשבורד וטבלה",
    meaning: "מעביר למסך פרטי הזמנה.",
    icon: ArrowLeft,
  },
  {
    button: "שמור עריכות",
    where: "פרטי הזמנה",
    meaning: "שומר תיקונים לפני אישור: שעה, כמות, חיתוך והערות.",
    icon: Pencil,
  },
  {
    button: "אשר הזמנה",
    where: "פרטי הזמנה",
    meaning: "הופך את ההזמנה למאושרת. זו פעולה אנושית בלבד.",
    icon: ShieldCheck,
  },
  {
    button: "הדפס בון",
    where: "פרטי הזמנה / בון",
    meaning: "פותח בון הכנה נקי להדפסה.",
    icon: Printer,
  },
  {
    button: "סמן מוכן לאיסוף",
    where: "פרטי הזמנה",
    meaning: "מעביר את ההזמנה לסטטוס שהלקוח יכול להגיע לאסוף.",
    icon: PackageCheck,
  },
];

function MarkerDot({ marker }: { marker: Marker }) {
  return (
    <span
      className="absolute z-10 grid h-8 w-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-teal-950 text-sm font-black text-white shadow-lg ring-4 ring-white/90"
      style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
    >
      {marker.n}
    </span>
  );
}

function ScreenshotCard({ screen }: { screen: ScreenGuide }) {
  return (
    <Card id={screen.id} className="overflow-hidden">
      <CardHeader className="gap-2 border-b border-slate-100">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <CardTitle className="text-2xl">{screen.title}</CardTitle>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">{screen.goal}</p>
          </div>
          <Badge tone="teal">צילום מוקטן</Badge>
        </div>
      </CardHeader>
      <CardContent className="grid gap-5 lg:grid-cols-[minmax(0,620px)_minmax(280px,1fr)] lg:items-start">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
          <div className="relative aspect-video overflow-hidden rounded-md bg-white">
            <Image
              src={`/guide/${screen.id}.png`}
              alt={`צילום מסך מוקטן של ${screen.title}`}
              fill
              unoptimized
              sizes="(max-width: 1024px) 100vw, 620px"
              className="object-contain"
            />
            {screen.markers.map((marker) => (
              <MarkerDot key={marker.n} marker={marker} />
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {screen.notes.map((note) => (
            <div key={note.n} className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex items-center gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-teal-950 text-sm font-black text-white">
                  {note.n}
                </span>
                <h3 className="font-black text-slate-950">{note.title}</h3>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600">{note.text}</p>
            </div>
          ))}
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-black text-amber-950">דרך עבודה מומלצת</p>
            <p className="mt-2 text-sm leading-6 text-amber-950/80">{screen.bestPractice}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function FlowStep({
  step,
  index,
}: {
  step: (typeof dailyFlow)[number];
  index: number;
}) {
  const Icon = step.icon;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-teal-950 text-white">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <p className="text-xs font-black text-teal-900">שלב {index + 1}</p>
          <h3 className="mt-1 font-black text-slate-950">{step.title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">{step.text}</p>
        </div>
      </div>
    </div>
  );
}

function ButtonGuideCard({ item }: { item: (typeof buttonGuide)[number] }) {
  const Icon = item.icon;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-slate-100 text-teal-950">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h3 className="font-black text-slate-950">{item.button}</h3>
          <p className="mt-1 text-xs font-bold text-slate-500">נמצא ב: {item.where}</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">{item.meaning}</p>
        </div>
      </div>
    </div>
  );
}

export function GuidePage() {
  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-teal-900/10 bg-white p-5 shadow-[0_18px_60px_-45px_rgba(13,94,99,0.65)] lg:p-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end">
          <div>
            <Badge tone="teal" className="mb-4 gap-2">
              <BookOpenCheck className="h-3.5 w-3.5" aria-hidden="true" />
              מדריך קצר וברור
            </Badge>
            <h1 className="text-3xl font-black tracking-tight text-slate-950 lg:text-5xl">
              איך עובדים נכון עם ״בון חכם״
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600 lg:text-lg">
              המדריך הזה מסביר מה לעשות בכל מסך, איזה כפתור לוחצים ומתי. התמונות כאן
              מוקטנות בכוונה: משתמשים במספרים שעל התמונה ואז קוראים את ההסבר ליד.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Button asChild size="lg">
                <Link href="/dashboard">
                  פתח דשבורד
                  <ArrowLeft className="h-5 w-5" aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/inbox">
                  נסה סימולטור
                  <MessageSquareText className="h-5 w-5" aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <p className="flex items-center gap-2 font-black text-amber-950">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              הדבר הכי חשוב
            </p>
            <p className="mt-2 text-sm leading-7 text-amber-950/80">
              המערכת מארגנת ומציעה. היא לא מאשרת אוטומטית, לא מבטיחה מחיר סופי
              ולא מחליפה בדיקה של החנות.
            </p>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-black text-teal-900">הדרך היומית</p>
            <h2 className="mt-1 text-2xl font-black text-slate-950 lg:text-3xl">
              סדר עבודה מומלץ בבוקר
            </h2>
          </div>
          <Badge tone="neutral">מתאים לעבודה בטאבלט ליד הדלפק</Badge>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {dailyFlow.map((step, index) => (
            <FlowStep key={step.title} step={step} index={index} />
          ))}
        </div>
      </section>

      <section>
        <div className="mb-4">
          <p className="text-sm font-black text-teal-900">מה עושים בכל מסך</p>
          <h2 className="mt-1 text-2xl font-black text-slate-950 lg:text-3xl">
            מסכים מרכזיים עם סימונים קצרים
          </h2>
        </div>
        <div className="space-y-5">
          {screens.map((screen) => (
            <ScreenshotCard key={screen.id} screen={screen} />
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardHeader>
            <CardTitle>מילון כפתורים</CardTitle>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              הכפתורים החשובים ביותר ומה המשמעות שלהם בפועל.
            </p>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {buttonGuide.map((item) => (
              <ButtonGuideCard key={item.button} item={item} />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>כללי החלטה מהירים</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              "אם חסרה שעת איסוף: לא מאשרים לפני שהלקוח משלים.",
              "אם כתוב ״כמו פעם שעברה״: פותחים לבדיקה אנושית.",
              "אם הלקוח שואל מחיר: לא מבטיחים מחיר סופי.",
              "אם רמת הוודאות נמוכה מ-85%: בודקים ידנית.",
              "אם המוצר לא מזוהה: מוסיפים כינוי לקטלוג או משאירים לבדיקה.",
            ].map((rule) => (
              <div key={rule} className="flex items-start gap-2 rounded-lg border border-slate-200 bg-white p-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal-900" aria-hidden="true" />
                <p className="text-sm leading-6 text-slate-700">{rule}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-teal-950 text-white">
            <Search className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-2xl font-black text-slate-950">הדרך הכי יעילה לעבוד בפועל</h2>
            <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-600">
              בבוקר פותחים דשבורד, מטפלים קודם בחריגים, עוברים לטבלת הזמנות ומסדרים לפי
              שעת איסוף. כל הזמנה נפתחת לבדיקה קצרה, מתקנים מה שחסר, לוחצים ״אשר הזמנה״
              רק כשהכול ברור, ואז מדפיסים בון ומעדכנים סטטוס לאורך ההכנה.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
