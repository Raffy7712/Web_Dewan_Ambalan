import { getSession } from "@/app/actions/auth";
import { redirect } from "next/navigation";
import { getPermissionMatrix } from "@/lib/admin-queries";
import PermissionsManager from "./PermissionsManager";

export default async function AdminPermissionsPage() {
  const session = await getSession();
  if (!session || session.role !== "admin") redirect("/anggota");

  const data = await getPermissionMatrix();
  return <PermissionsManager keys={data.keys} matrix={data.matrix} />;
}
