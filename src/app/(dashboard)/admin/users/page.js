import { getSession } from "@/app/actions/auth";
import { redirect } from "next/navigation";
import { getAccountsForAdminList } from "@/lib/admin-queries";
import UsersManager from "./UsersManager";

export default async function AdminUsersPage() {
  const session = await getSession();
  if (!session || session.role !== "admin") redirect("/anggota");

  const accounts = await getAccountsForAdminList();
  const listKey = accounts
    .map((a) => `${a.id}:${a.banned ? 1 : 0}`)
    .join("|");
  return (
    <UsersManager
      key={listKey}
      accounts={accounts}
      currentUserId={session.id}
    />
  );
}
