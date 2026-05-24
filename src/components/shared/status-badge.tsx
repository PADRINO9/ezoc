import { AlertTriangle, CheckCircle2, Clock3, PackageCheck, PauseCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getStatusLabel, statusBadgeClasses } from "@/lib/status-utils";
import type { OrderStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const icons: Partial<Record<OrderStatus, typeof Clock3>> = {
  missing_details: AlertTriangle,
  pending_review: Clock3,
  approved: CheckCircle2,
  in_preparation: Clock3,
  ready: PackageCheck,
  picked_up: CheckCircle2,
  cancelled: PauseCircle,
  human_review: AlertTriangle,
};

export function StatusBadge({ status, className }: { status: OrderStatus; className?: string }) {
  const Icon = icons[status] ?? Clock3;

  return (
    <Badge className={cn("gap-1.5 border", statusBadgeClasses[status], className)}>
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {getStatusLabel(status)}
    </Badge>
  );
}
