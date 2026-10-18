import StaffPerformancePage from "@/components/dashboard/finance/StaffPerformancePage";
export const metadata = { title: "Staff KPI & Performance | AfghanUstad" };
export default function Page({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  return <StaffPerformancePage role="MANAGER" searchParams={searchParams} />;
}
