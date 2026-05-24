import { OrdersTable } from "@/components/orders/orders-table";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { getOrders } from "@/lib/data-store";
import Link from "next/link";

export default async function OrdersPage() {
  const orders = await getOrders();

  return (
    <div>
      <PageHeader
        eyebrow="ניהול הכנות"
        title="הזמנות"
        description="טבלה תפעולית לכל ההזמנות שנוצרו מהודעות. בעל החנות עורך, מאשר ומעביר סטטוסים מכאן."
        actions={
          <Button asChild>
            <Link href="/inbox">קליטת הודעה חדשה</Link>
          </Button>
        }
      />
      <OrdersTable orders={orders} />
    </div>
  );
}
