import { getSession } from "@/app/actions/auth";
import { redirect } from "next/navigation";
import { getFinanceDataAdmin } from "@/lib/finance-queries";
import FinanceAdminManager from "./FinanceAdminManager";

export default async function AdminFinancePage() {
  const session = await getSession();
  if (!session || session.role !== "admin") redirect("/anggota");

  const { months, transactionsByMonth } = await getFinanceDataAdmin();

  return (
    <FinanceAdminManager
      months={months}
      transactionsByMonth={transactionsByMonth}
    />
  );
}
