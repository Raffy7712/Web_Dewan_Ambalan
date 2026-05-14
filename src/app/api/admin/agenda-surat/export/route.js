import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { getSession } from "@/lib/auth-session";
import { createAdminClient } from "@/lib/supabase";

function filenameStem() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `agenda-surat_${y}-${m}-${day}`;
}

export async function GET(request) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const scope = searchParams.get("scope") ?? "both";
  if (!["masuk", "keluar", "both"].includes(scope)) {
    return NextResponse.json({ error: "Invalid scope" }, { status: 400 });
  }

  const db = createAdminClient();
  const wb = XLSX.utils.book_new();

  async function appendMasuk() {
    const { data, error } = await db
      .from("surat_masuk")
      .select(
        "tanggal_diterima, tanggal_surat, nomor_surat, dari, perihal, catatan, lampiran_url, created_at",
      )
      .order("tanggal_diterima", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      const ws = XLSX.utils.aoa_to_sheet([
        ["Error", error.message],
        ["Jalankan migration-v9.sql di Supabase jika tabel belum ada.", ""],
      ]);
      XLSX.utils.book_append_sheet(wb, ws, "Surat masuk");
      return;
    }

    const rows = (data ?? []).map((r) => ({
      "Tanggal diterima": r.tanggal_diterima ?? "",
      "Tanggal surat": r.tanggal_surat ?? "",
      "Nomor surat": r.nomor_surat ?? "",
      Dari: r.dari ?? "",
      Perihal: r.perihal ?? "",
      Catatan: r.catatan ?? "",
      "Lampiran URL": r.lampiran_url ?? "",
      "Dicatat (server)": r.created_at ?? "",
    }));

    const ws = XLSX.utils.json_to_sheet(
      rows.length > 0 ? rows : [{ Keterangan: "Belum ada data surat masuk" }],
    );
    XLSX.utils.book_append_sheet(wb, ws, "Surat masuk");
  }

  async function appendKeluar() {
    const { data, error } = await db
      .from("surat_keluar")
      .select(
        "tanggal_keluar, nomor_surat, kepada, perihal, catatan, lampiran_url, created_at",
      )
      .order("tanggal_keluar", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      const ws = XLSX.utils.aoa_to_sheet([
        ["Error", error.message],
        ["Jalankan migration-v9.sql di Supabase jika tabel belum ada.", ""],
      ]);
      XLSX.utils.book_append_sheet(wb, ws, "Surat keluar");
      return;
    }

    const rows = (data ?? []).map((r) => ({
      "Tanggal keluar": r.tanggal_keluar ?? "",
      "Nomor surat": r.nomor_surat ?? "",
      Kepada: r.kepada ?? "",
      Perihal: r.perihal ?? "",
      Catatan: r.catatan ?? "",
      "Lampiran URL": r.lampiran_url ?? "",
      "Dicatat (server)": r.created_at ?? "",
    }));

    const ws = XLSX.utils.json_to_sheet(
      rows.length > 0 ? rows : [{ Keterangan: "Belum ada data surat keluar" }],
    );
    XLSX.utils.book_append_sheet(wb, ws, "Surat keluar");
  }

  try {
    if (scope === "masuk" || scope === "both") await appendMasuk();
    if (scope === "keluar" || scope === "both") await appendKeluar();

    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    const name =
      scope === "both" ? `${filenameStem()}_semua.xlsx` : `${filenameStem()}_${scope}.xlsx`;

    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${name}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    console.error("agenda xlsx export:", e);
    return NextResponse.json({ error: "Gagal membuat berkas" }, { status: 500 });
  }
}
