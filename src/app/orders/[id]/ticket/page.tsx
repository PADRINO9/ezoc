import { notFound } from "next/navigation";
import { PrintTicket } from "@/components/orders/print-ticket";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { getOrderById, getSettings } from "@/lib/data-store";
import Link from "next/link";

export default async function TicketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [order, settings] = await Promise.all([getOrderById(id), getSettings()]);
  if (!order) notFound();

  return (
    <div>
      <PageHeader
        eyebrow="הדפסה"
        title={`בון הכנה ${order.order_number}`}
        description="בון קומפקטי וברור לצוות ההכנה."
        actions={
          <Button asChild variant="outline">
            <Link href={`/orders/${order.id}`}>חזרה להזמנה</Link>
          </Button>
        }
      />
      <PrintTicket order={order} settings={settings} />
    </div>
  );
}
