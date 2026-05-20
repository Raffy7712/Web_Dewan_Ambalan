"use server";

import { query } from "@/lib/db";
import { getSession } from "./auth";
import { revalidatePath } from "next/cache";
import { getStaffEmails } from "@/lib/queries";
import { sendStaffFinancePublishedNotification } from "@/lib/email";
import { monthLabel } from "@/lib/finance-utils";

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

  try {
    await query(
      "INSERT INTO finance_months (year, month, saldo_awal, catatan_publik, is_published, updated_by) VALUES ($1, $2, $3, $4, $5, $6)",
      [year, month, saldo_awal, catatan_publik, is_published, session.id]
    );
  } catch (err) {
    if (err.code === "23505") {
      return { error: "Periode tahun & bulan ini sudah ada." };
    }
    if (err.code === "42P01") {
      return { error: "Jalankan migration-v8.sql di Supabase terlebih dahulu." };
    }
    console.error("createFinanceMonthAction:", err.message);
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

  let prevRow;
  try {
    const prevResult = await query(
      "SELECT is_published, year, month FROM finance_months WHERE id = $1",
      [id]
    );
    prevRow = prevResult.rows[0] ?? null;
  } catch (err) {
    prevRow = null;
  }

  try {
    await query(
      "UPDATE finance_months SET saldo_awal = $1, catatan_publik = $2, is_published = $3, updated_by = $4 WHERE id = $5",
      [saldo_awal, catatan_publik, is_published, session.id, id]
    );
  } catch (err) {
    console.error("updateFinanceMonthAction:", err.message);
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

  try {
    await query("DELETE FROM finance_months WHERE id = $1", [id]);
  } catch (err) {
    console.error("deleteFinanceMonthAction:", err.message);
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

  try {
    await query(
      "INSERT INTO finance_transactions (month_id, tanggal, jenis, keterangan, jumlah) VALUES ($1, $2, $3, $4, $5)",
      [month_id, tanggal, jenis, keterangan, jumlah]
    );
  } catch (err) {
    if (err.code === "42P01") {
      return { error: "Jalankan migration-v8.sql di Supabase." };
    }
    console.error("addFinanceTransactionAction:", err.message);
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

  try {
    await query("DELETE FROM finance_transactions WHERE id = $1", [id]);
  } catch (err) {
    console.error("deleteFinanceTransactionAction:", err.message);
    return { error: "Gagal menghapus transaksi." };
  }

  revalidatePath("/admin/finance");
  revalidatePath("/keuangan");
  return { success: true };
}
