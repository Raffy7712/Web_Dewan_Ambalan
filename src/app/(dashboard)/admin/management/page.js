import { getSession } from "@/app/actions/auth";
import { redirect } from "next/navigation";
import { getAccountsForAdminList } from "@/lib/admin-queries";
import StaffRoleManager from "./StaffRoleManager";

export default async function AdminManagementPage() {
  const session = await getSession();
  if (!session || session.role !== "admin") redirect("/anggota");

  const accounts = await getAccountsForAdminList();
  const adminActiveCount = accounts.filter(
    (a) => a.role === "admin" && a.is_active && !a.banned,
  ).length;

  const listKey = accounts.map((a) => `${a.id}:${a.role}`).join("|");

  return (
    <StaffRoleManager
      key={listKey}
      accounts={accounts}
      currentUserId={session.id}
      adminActiveCount={adminActiveCount}
    />
  );
}
