import { notFound } from "next/navigation";
import { OrderDetails } from "@/components/orders/order-details";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { getOrderById } from "@/lib/data-store";
import Link from "next/link";

export default async function OrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getOrderById(id);
  if (!order) notFound();

  return (
    <div>
      <PageHeader
        eyebrow="פרטי הזמנה"
        title={`הזמנה ${order.order_number}`}
        description="בדיקה, עריכה, אישור והעברה להכנה. ה-AI לא מסיים הזמנה לבד."
        actions={
          <Button asChild variant="outline">
            <Link href="/orders">חזרה להזמנות</Link>
          </Button>
        }
      />
      <OrderDetails order={order} />
    </div>
  );
}
