import { MorningDashboard } from "@/components/dashboard/morning-dashboard";
import { getDashboardData } from "@/lib/data-store";

export default async function DashboardPage() {
  const data = await getDashboardData();

  return <MorningDashboard data={data} />;
}
