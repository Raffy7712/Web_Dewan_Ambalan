import { getSession } from "@/app/actions/auth";
import { redirect } from "next/navigation";
import { getSuratKeluarList, getSuratMasukList } from "@/app/actions/agenda-surat";
import AgendaSuratManager from "./AgendaSuratManager";

export default async function AgendaSuratPage() {
  const session = await getSession();
  if (!session || session.role !== "admin") redirect("/anggota");

  const [suratMasuk, suratKeluar] = await Promise.all([
    getSuratMasukList(),
    getSuratKeluarList(),
  ]);

  return <AgendaSuratManager initialMasuk={suratMasuk} initialKeluar={suratKeluar} />;
}
