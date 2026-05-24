"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClipboardList,
  BookOpenCheck,
  LayoutDashboard,
  MessageSquareText,
  PackageOpen,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "דשבורד", icon: LayoutDashboard },
  { href: "/guide", label: "מדריך שימוש", icon: BookOpenCheck },
  { href: "/inbox", label: "הודעות וואטסאפ", icon: MessageSquareText },
  { href: "/orders", label: "הזמנות", icon: ClipboardList },
  { href: "/catalog", label: "קטלוג מוצרים", icon: PackageOpen },
  { href: "/settings", label: "הגדרות", icon: Settings },
  { href: "/customers", label: "לקוחות", icon: Users, disabled: true },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#f6f5f1] text-slate-950">
      <aside className="fixed inset-y-0 right-0 z-40 hidden w-72 border-l border-slate-200 bg-white/95 px-4 py-5 shadow-sm backdrop-blur lg:block print:hidden">
        <Link href="/dashboard" className="flex items-center gap-3 rounded-lg px-2 py-2">
          <span className="grid h-11 w-11 place-items-center rounded-lg bg-teal-950 text-white">
            <ShieldCheck className="h-5 w-5" aria-hidden="true" />
          </span>
          <span>
            <span className="block text-xl font-black tracking-tight">בון חכם</span>
            <span className="block text-xs font-semibold text-slate-500">ניהול הזמנות חכם לחנות דגים</span>
          </span>
        </Link>

        <nav aria-label="ניווט ראשי" className="mt-8 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

            return item.disabled ? (
              <span
                key={item.href}
                className="flex h-11 items-center gap-3 rounded-md px-3 text-sm font-semibold text-slate-300"
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {item.label}
                <span className="mr-auto rounded-full bg-slate-100 px-2 py-0.5 text-[11px]">בקרוב</span>
              </span>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex h-11 items-center gap-3 rounded-md px-3 text-sm font-bold transition",
                  isActive
                    ? "bg-teal-950 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
                )}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="absolute inset-x-4 bottom-5 rounded-lg border border-teal-900/10 bg-teal-50 p-4">
          <p className="text-sm font-black text-teal-950">כל טיוטה דורשת אישור אנושי</p>
          <p className="mt-1 text-xs leading-5 text-teal-900/75">
            המערכת מארגנת, שואלת ומשקפת סיכון. ההכנה מתחילה רק אחרי פעולה של החנות.
          </p>
        </div>
      </aside>

      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur lg:hidden print:hidden">
        <div className="flex items-center justify-between gap-3">
          <Link href="/dashboard" className="flex items-center gap-2 font-black">
            <span className="grid h-9 w-9 place-items-center rounded-md bg-teal-950 text-white">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            </span>
            בון חכם
          </Link>
          <nav className="flex gap-1 overflow-x-auto" aria-label="ניווט מובייל">
            {navItems
              .filter((item) => !item.disabled)
              .map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "grid h-10 min-w-10 place-items-center rounded-md",
                      isActive ? "bg-teal-950 text-white" : "text-slate-600 hover:bg-slate-100",
                    )}
                    aria-label={item.label}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </Link>
                );
              })}
          </nav>
        </div>
      </header>

      <main className="min-h-screen px-4 py-6 lg:mr-72 lg:px-8 print:m-0 print:min-h-0 print:p-0">
        {children}
      </main>
    </div>
  );
}
