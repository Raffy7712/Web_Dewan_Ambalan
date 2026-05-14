import { getCurrentUser } from "@/lib/auth-session";
import { redirect } from "next/navigation";
import ProfilClient from "./ProfilClient";

export default async function ProfilPage() {
  const account = await getCurrentUser();
  if (!account) redirect("/login");

  return <ProfilClient account={account} />;
}
