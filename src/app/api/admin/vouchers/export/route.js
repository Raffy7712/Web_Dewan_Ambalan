import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { getSession } from "@/lib/auth-session";
import { createAdminClient } from "@/lib/supabase";

function filenameStem() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `voucher-sertifikat_${y}-${m}-${day}`;
}

export async function GET(request) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const scope = searchParams.get("scope") ?? "both";
  if (!["voucher", "certificate", "both"].includes(scope)) {
    return NextResponse.json({ error: "Invalid scope" }, { status: 400 });
  }

  const db = createAdminClient();
  const wb = XLSX.utils.book_new();

  async function appendVouchers() {
    const { data, error } = await db
      .from("vouchers")
      .select(
        "code, title, description, status, expires_at, created_at",
      )
      .order("created_at", { ascending: false });

    if (error) {
      const ws = XLSX.utils.aoa_to_sheet([
        ["Error", error.message],
        ["Jalankan migration-v10.sql di Supabase jika tabel belum ada.", ""],
      ]);
      XLSX.utils.book_append_sheet(wb, ws, "Voucher");
      return;
    }

    const rows = (data ?? []).map((r) => ({
      Kode: r.code ?? "",
      Judul: r.title ?? "",
      Deskripsi: r.description ?? "",
      Status: r.status ?? "",
      "Kadaluarsa": r.expires_at
        ? new Date(r.expires_at).toLocaleDateString("id-ID")
        : "-",
      "Dibuat": r.created_at
        ? new Date(r.created_at).toLocaleDateString("id-ID")
        : "",
    }));

    const ws = XLSX.utils.json_to_sheet(
      rows.length > 0 ? rows : [{ Keterangan: "Belum ada data voucher" }],
    );
    ws["!cols"] = [
      { wch: 20 }, // Kode
      { wch: 30 }, // Judul
      { wch: 35 }, // Deskripsi
      { wch: 12 }, // Status
      { wch: 14 }, // Kadaluarsa
      { wch: 14 }, // Dibuat
    ];
    XLSX.utils.book_append_sheet(wb, ws, "Voucher");
  }

  async function appendCertificates() {
    const { data, error } = await db
      .from("certificates")
      .select(
        "code, recipient_name, certificate_type, dewan_ambalan, status, created_at",
      )
      .order("created_at", { ascending: false });

    if (error) {
      const ws = XLSX.utils.aoa_to_sheet([
        ["Error", error.message],
        ["Jalankan migration-v10.sql di Supabase jika tabel belum ada.", ""],
      ]);
      XLSX.utils.book_append_sheet(wb, ws, "Sertifikat");
      return;
    }

    const rows = (data ?? []).map((r) => ({
      Kode: r.code ?? "",
      "Nama Penerima": r.recipient_name ?? "",
      "Jenis Sertifikat": r.certificate_type ?? "",
      "Dewan Ambalan": r.dewan_ambalan ?? "",
      Status: r.status ?? "",
      "Dibuat": r.created_at
        ? new Date(r.created_at).toLocaleDateString("id-ID")
        : "",
    }));

    const ws = XLSX.utils.json_to_sheet(
      rows.length > 0 ? rows : [{ Keterangan: "Belum ada data sertifikat" }],
    );
    ws["!cols"] = [
      { wch: 20 }, // Kode
      { wch: 25 }, // Nama Penerima
      { wch: 22 }, // Jenis Sertifikat
      { wch: 25 }, // Dewan Ambalan
      { wch: 12 }, // Status
      { wch: 14 }, // Dibuat
    ];
    XLSX.utils.book_append_sheet(wb, ws, "Sertifikat");
  }

  try {
    if (scope === "voucher" || scope === "both") await appendVouchers();
    if (scope === "certificate" || scope === "both") await appendCertificates();

    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    const name =
      scope === "both"
        ? `${filenameStem()}_semua.xlsx`
        : `${filenameStem()}_${scope}.xlsx`;

    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${name}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    console.error("vouchers xlsx export:", e);
    return NextResponse.json(
      { error: "Gagal membuat berkas" },
      { status: 500 },
    );
  }
}
