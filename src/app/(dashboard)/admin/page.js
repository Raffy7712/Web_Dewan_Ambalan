import { getSession } from "@/lib/auth-session";
import { redirect } from "next/navigation";
import AdminDocuments from "./AdminDocuments";

const JENIS = ["sertifikat", "piagam", "surat", "voucher"];

export const metadata = { title: "Kelola Dokumen | Admin" };

export default async function AdminDocumentsPage({ searchParams }) {
  const session = await getSession();
  if (!session || session.role !== "admin") redirect("/login?next=/admin");

  const sp = await searchParams;
  const jenis = typeof sp?.jenis === "string" ? sp.jenis : "";
  const q = typeof sp?.q === "string" ? sp.q : "";
  const page = Math.max(1, parseInt(typeof sp?.page === "string" ? sp.page : "1", 10) || 1);

  return (
    <AdminDocuments
      jenisOptions={JENIS}
      query={{ jenis, q, page }}
    />
  );
}
