
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/requireRole";

export const metadata = {
  title: "Record KPI Evaluation | AfghanUstad",
};

export default async function NewKPA() {
  await requireRole(["GUIDE"]);
  redirect("/guide/assignments");
}
