import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { getSession } from "@/lib/auth-session";
import { createAdminClient } from "@/lib/supabase";

function filenameStem() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `data-anggota_${y}-${m}-${day}`;
}

export async function GET(request) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = createAdminClient();

  // Fetch all active members with jabatan
  const { data: members, error: membersError } = await db
    .from("accounts")
    .select(
      `id, display_name, username, email, role, bio, profile_picture_url, created_at,
       jabatan:jabatan(id, nama, urutan)`,
    )
    .eq("is_active", true)
    .order("display_name", { ascending: true });

  if (membersError) {
    return NextResponse.json(
      { error: "Gagal mengambil data: " + membersError.message },
      { status: 500 },
    );
  }

  const list = members ?? [];
  const wb = XLSX.utils.book_new();

  // Sheet 1: Struktur pengurus (members WITH jabatan)
  const pengurusList = list.filter((m) => m.jabatan);
  const pengurusRows = pengurusList.map((m) => ({
    "Nama Lengkap": m.display_name ?? "",
    Username: m.username ?? "",
    Email: m.email ?? "",
    Jabatan: m.jabatan?.nama ?? "",
    "Urutan Jabatan": m.jabatan?.urutan ?? "",
    Bio: m.bio ?? "",
    "Tanggal Daftar": m.created_at
      ? new Date(m.created_at).toLocaleDateString("id-ID")
      : "",
  }));

  const wsPengurus = XLSX.utils.json_to_sheet(
    pengurusRows.length > 0
      ? pengurusRows
      : [{ Keterangan: "Belum ada pengurus dengan jabatan" }],
  );

  wsPengurus["!cols"] = [
    { wch: 22 }, // Nama Lengkap
    { wch: 15 }, // Username
    { wch: 28 }, // Email
    { wch: 25 }, // Jabatan
    { wch: 10 }, // Urutan
    { wch: 35 }, // Bio
    { wch: 15 }, // Tanggal Daftar
  ];

  XLSX.utils.book_append_sheet(wb, wsPengurus, "Struktur Pengurus");

  // Sheet 2: Semua anggota aktif
  const allRows = list.map((m) => ({
    "Nama Lengkap": m.display_name ?? "",
    Username: m.username ?? "",
    Email: m.email ?? "",
    Role: m.role ?? "user",
    Jabatan: m.jabatan?.nama ?? "-",
    Bio: m.bio ?? "",
    "Tanggal Daftar": m.created_at
      ? new Date(m.created_at).toLocaleDateString("id-ID")
      : "",
  }));

  const wsAll = XLSX.utils.json_to_sheet(
    allRows.length > 0
      ? allRows
      : [{ Keterangan: "Belum ada anggota aktif" }],
  );

  wsAll["!cols"] = [
    { wch: 22 }, // Nama Lengkap
    { wch: 15 }, // Username
    { wch: 28 }, // Email
    { wch: 12 }, // Role
    { wch: 25 }, // Jabatan
    { wch: 35 }, // Bio
    { wch: 15 }, // Tanggal Daftar
  ];

  XLSX.utils.book_append_sheet(wb, wsAll, "Semua Anggota");

  try {
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    const name = `${filenameStem()}.xlsx`;

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
    console.error("members xlsx export:", e);
    return NextResponse.json(
      { error: "Gagal membuat berkas" },
      { status: 500 },
    );
  }
}
