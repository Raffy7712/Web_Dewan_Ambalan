import { getSession } from "@/app/actions/auth";
import { redirect } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";

export default async function AdminSectionLayout({ children }) {
  const session = await getSession();
  if (!session || session.role !== "admin") redirect("/anggota");

  return <AdminShell>{children}</AdminShell>;
}
