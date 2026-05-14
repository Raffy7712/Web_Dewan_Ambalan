"use server";

import { createAdminClient } from "@/lib/supabase";
import { getSession } from "./auth";
import { revalidatePath } from "next/cache";
import { getStaffEmails } from "@/lib/queries";
import { sendStaffFinancePublishedNotification } from "@/lib/email";
import { monthLabel } from "@/lib/finance-queries";

function notifyStaffFinancePublished(year, month) {
  const periodLabel = monthLabel(year, month);
  getStaffEmails()
    .then((staff) =>
      sendStaffFinancePublishedNotification(staff, { periodLabel }),
    )
    .catch(() => {});
}

async function ensureAdmin() {
  const session = await getSession();
  if (!session || session.role !== "admin") return null;
  return session;
}

function parseMoney(raw) {
  const s = String(raw ?? "").replace(/\s/g, "").replace(/,/g, ".");
  const n = Number(s);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100) / 100;
}

export async function createFinanceMonthAction(prevState, formData) {
  const session = await ensureAdmin();
  if (!session) return { error: "Tidak punya izin." };

  const year = Number(formData.get("year"));
  const month = Number(formData.get("month"));
  const saldo_awal = parseMoney(formData.get("saldo_awal")) ?? 0;
  const catatan_publik = formData.get("catatan_publik")?.toString().trim() || null;
  const is_published = formData.get("is_published") === "on";

  if (!Number.isInteger(year) || year < 2020 || year > 2100) {
    return { error: "Tahun tidak valid." };
  }
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    return { error: "Bulan tidak valid." };
  }

  const db = createAdminClient();
  const { error } = await db.from("finance_months").insert({
    year,
    month,
    saldo_awal,
    catatan_publik,
    is_published,
    updated_by: session.id,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "Periode tahun & bulan ini sudah ada." };
    }
    if (error.code === "42P01") {
      return { error: "Jalankan migration-v8.sql di Supabase terlebih dahulu." };
    }
    console.error("createFinanceMonthAction:", error.message);
    return { error: "Gagal menyimpan periode." };
  }

  revalidatePath("/admin/finance");
  revalidatePath("/keuangan");
  if (is_published) notifyStaffFinancePublished(year, month);
  return { success: true };
}

export async function updateFinanceMonthAction(prevState, formData) {
  const session = await ensureAdmin();
  if (!session) return { error: "Tidak punya izin." };

  const id = formData.get("month_id")?.toString() ?? "";
  if (!id) return { error: "Periode tidak valid." };

  const saldo_awal = parseMoney(formData.get("saldo_awal"));
  if (saldo_awal === null) return { error: "Saldo awal tidak valid." };

  const catatan_publik = formData.get("catatan_publik")?.toString().trim() || null;
  const is_published = formData.get("is_published") === "on";

  const db = createAdminClient();
  const { data: prevRow } = await db
    .from("finance_months")
    .select("is_published, year, month")
    .eq("id", id)
    .maybeSingle();

  const { error } = await db
    .from("finance_months")
    .update({
      saldo_awal,
      catatan_publik,
      is_published,
      updated_by: session.id,
    })
    .eq("id", id);

  if (error) {
    console.error("updateFinanceMonthAction:", error.message);
    return { error: "Gagal memperbarui periode." };
  }

  revalidatePath("/admin/finance");
  revalidatePath("/keuangan");
  if (
    is_published &&
    !prevRow?.is_published &&
    prevRow?.year != null &&
    prevRow?.month != null
  ) {
    notifyStaffFinancePublished(prevRow.year, prevRow.month);
  }
  return { success: true };
}

export async function deleteFinanceMonthAction(prevState, formData) {
  const session = await ensureAdmin();
  if (!session) return { error: "Tidak punya izin." };

  const id = formData.get("month_id")?.toString() ?? "";
  if (!id) return { error: "Periode tidak valid." };

  const db = createAdminClient();
  const { error } = await db.from("finance_months").delete().eq("id", id);

  if (error) {
    console.error("deleteFinanceMonthAction:", error.message);
    return { error: "Gagal menghapus periode." };
  }

  revalidatePath("/admin/finance");
  revalidatePath("/keuangan");
  return { success: true };
}

export async function addFinanceTransactionAction(prevState, formData) {
  const session = await ensureAdmin();
  if (!session) return { error: "Tidak punya izin." };

  const month_id = formData.get("month_id")?.toString() ?? "";
  const tanggal = formData.get("tanggal")?.toString() ?? "";
  const jenis = formData.get("jenis")?.toString() ?? "";
  const keterangan = formData.get("keterangan")?.toString().trim() ?? "";
  const jumlah = parseMoney(formData.get("jumlah"));

  if (!month_id) return { error: "Periode wajib dipilih." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(tanggal)) return { error: "Tanggal tidak valid." };
  if (jenis !== "pemasukan" && jenis !== "pengeluaran") {
    return { error: "Jenis transaksi tidak valid." };
  }
  if (!keterangan) return { error: "Keterangan wajib diisi." };
  if (jumlah === null || jumlah <= 0) return { error: "Jumlah harus lebih dari 0." };

  const db = createAdminClient();
  const { error } = await db.from("finance_transactions").insert({
    month_id,
    tanggal,
    jenis,
    keterangan,
    jumlah,
  });

  if (error) {
    if (error.code === "42P01") {
      return { error: "Jalankan migration-v8.sql di Supabase." };
    }
    console.error("addFinanceTransactionAction:", error.message);
    return { error: "Gagal menambah transaksi." };
  }

  revalidatePath("/admin/finance");
  revalidatePath("/keuangan");
  return { success: true };
}

export async function deleteFinanceTransactionAction(prevState, formData) {
  const session = await ensureAdmin();
  if (!session) return { error: "Tidak punya izin." };

  const id = formData.get("transaction_id")?.toString() ?? "";
  if (!id) return { error: "Transaksi tidak valid." };

  const db = createAdminClient();
  const { error } = await db.from("finance_transactions").delete().eq("id", id);

  if (error) {
    console.error("deleteFinanceTransactionAction:", error.message);
    return { error: "Gagal menghapus transaksi." };
  }

  revalidatePath("/admin/finance");
  revalidatePath("/keuangan");
  return { success: true };
}
