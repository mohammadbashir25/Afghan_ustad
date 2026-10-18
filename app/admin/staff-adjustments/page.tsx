import StaffAdjustmentsPage from "@/components/dashboard/finance/StaffAdjustmentsPage";
export const metadata = { title: "Staff Fines & Gifts | AfghanUstad" };
export default async function Page({searchParams}:{searchParams:Promise<{saved?:string;error?:string}>}) { return <StaffAdjustmentsPage role="SUPER_ADMIN" searchParams={searchParams} />; }
