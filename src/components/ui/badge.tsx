import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: "neutral" | "teal" | "blue" | "orange" | "red" | "green" | "amber" | "purple";
}

const toneClasses: Record<NonNullable<BadgeProps["tone"]>, string> = {
  neutral: "border-slate-200 bg-slate-50 text-slate-700",
  teal: "border-teal-200 bg-teal-50 text-teal-900",
  blue: "border-blue-200 bg-blue-50 text-blue-800",
  orange: "border-orange-200 bg-orange-50 text-orange-800",
  red: "border-red-200 bg-red-50 text-red-800",
  green: "border-emerald-200 bg-emerald-50 text-emerald-900",
  amber: "border-amber-200 bg-amber-50 text-amber-900",
  purple: "border-indigo-200 bg-indigo-50 text-indigo-900",
};

export function Badge({ className, tone = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex min-h-7 items-center rounded-full border px-2.5 py-1 text-xs font-bold leading-none",
        toneClasses[tone],
        className,
      )}
      {...props}
    />
  );
}
