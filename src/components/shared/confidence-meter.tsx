import { cn, formatPercent } from "@/lib/utils";

export function ConfidenceMeter({ value, compact = false }: { value: number; compact?: boolean }) {
  const tone =
    value >= 85
      ? "bg-emerald-600"
      : value >= 70
        ? "bg-amber-500"
        : "bg-red-600";

  return (
    <div className={cn("min-w-28", compact && "min-w-20")}>
      <div className="flex items-center justify-between gap-2 text-xs font-bold text-slate-600">
        <span>אמון AI</span>
        <span dir="ltr">{formatPercent(value)}</span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
        <div className={cn("h-full rounded-full", tone)} style={{ width: `${Math.max(4, value)}%` }} />
      </div>
    </div>
  );
}
