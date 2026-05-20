"use server";

import { query, getClient } from "@/lib/db";
import { getSession } from "./auth";
import { revalidatePath } from "next/cache";

async function ensureAdminSession() {
  const session = await getSession();
  if (!session || session.role !== "admin") return null;
  return session;
}

function revalidateAgenda() {
  revalidatePath("/admin/agenda-surat");
}

export async function getSuratMasukList() {
  const session = await ensureAdminSession();
  if (!session) return [];

  try {
    const result = await query(
      `SELECT id, tanggal_diterima, nomor_surat, tanggal_surat, dari, perihal, catatan, lampiran_url, created_at
       FROM surat_masuk
       ORDER BY tanggal_diterima DESC, created_at DESC`
    );
    return result.rows;
  } catch (err) {
    console.error("getSuratMasukList:", err.message);
    return [];
  }
}

export async function getSuratKeluarList() {
  const session = await ensureAdminSession();
  if (!session) return [];

  try {
    const result = await query(
      `SELECT id, tanggal_keluar, nomor_surat, kepada, perihal, catatan, lampiran_url, created_at
       FROM surat_keluar
       ORDER BY tanggal_keluar DESC, created_at DESC`
    );
    return result.rows;
  } catch (err) {
    console.error("getSuratKeluarList:", err.message);
    return [];
  }
}

export async function saveSuratMasukAction(prevState, formData) {
  const session = await ensureAdminSession();
  if (!session) return { error: "Hanya admin yang dapat mengubah buku agenda surat." };

  const id = formData.get("id")?.toString().trim() || null;
  const tanggal_diterima = formData.get("tanggal_diterima")?.toString().trim() ?? "";
  const nomor_surat = formData.get("nomor_surat")?.toString().trim() ?? "";
  const tanggal_surat = formData.get("tanggal_surat")?.toString().trim() || null;
  const dari = formData.get("dari")?.toString().trim() ?? "";
  const perihal = formData.get("perihal")?.toString().trim() ?? "";
  const catatan = formData.get("catatan")?.toString().trim() || null;
  const lampiran_url = formData.get("lampiran_url")?.toString().trim() || null;

  if (!tanggal_diterima || !nomor_surat || !dari || !perihal) {
    return { error: "Tanggal diterima, nomor surat, dari, dan perihal wajib diisi." };
  }

  try {
    if (id) {
      await query(
        `UPDATE surat_masuk SET tanggal_diterima = $1, nomor_surat = $2, tanggal_surat = $3, dari = $4, perihal = $5, catatan = $6, lampiran_url = $7 WHERE id = $8`,
        [tanggal_diterima, nomor_surat, tanggal_surat || null, dari, perihal, catatan, lampiran_url, id]
      );
    } else {
      await query(
        `INSERT INTO surat_masuk (tanggal_diterima, nomor_surat, tanggal_surat, dari, perihal, catatan, lampiran_url, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [tanggal_diterima, nomor_surat, tanggal_surat || null, dari, perihal, catatan, lampiran_url, session.id]
      );
    }
  } catch (err) {
    if (err.code === "42P01") {
      return { error: "Tabel surat belum ada. Jalankan migration-v9.sql di Supabase." };
    }
    return { error: id ? "Gagal memperbarui surat masuk." : "Gagal menambah surat masuk." };
  }

  revalidateAgenda();
  return { success: true };
}

export async function deleteSuratMasukAction(prevState, formData) {
  const session = await ensureAdminSession();
  if (!session) return { error: "Hanya admin yang dapat menghapus entri agenda." };

  const id = formData.get("id")?.toString().trim();
  if (!id) return { error: "ID tidak valid." };

  try {
    await query("DELETE FROM surat_masuk WHERE id = $1", [id]);
  } catch (err) {
    return { error: "Gagal menghapus surat masuk." };
  }

  revalidateAgenda();
  return { success: true };
}

export async function saveSuratKeluarAction(prevState, formData) {
  const session = await ensureAdminSession();
  if (!session) return { error: "Hanya admin yang dapat mengubah buku agenda surat." };

  const id = formData.get("id")?.toString().trim() || null;
  const tanggal_keluar = formData.get("tanggal_keluar")?.toString().trim() ?? "";
  const nomor_surat = formData.get("nomor_surat")?.toString().trim() ?? "";
  const kepada = formData.get("kepada")?.toString().trim() ?? "";
  const perihal = formData.get("perihal")?.toString().trim() ?? "";
  const catatan = formData.get("catatan")?.toString().trim() || null;
  const lampiran_url = formData.get("lampiran_url")?.toString().trim() || null;

  if (!tanggal_keluar || !nomor_surat || !kepada || !perihal) {
    return { error: "Tanggal keluar, nomor surat, kepada, dan perihal wajib diisi." };
  }

  try {
    if (id) {
      await query(
        `UPDATE surat_keluar SET tanggal_keluar = $1, nomor_surat = $2, kepada = $3, perihal = $4, catatan = $5, lampiran_url = $6 WHERE id = $7`,
        [tanggal_keluar, nomor_surat, kepada, perihal, catatan, lampiran_url, id]
      );
    } else {
      await query(
        `INSERT INTO surat_keluar (tanggal_keluar, nomor_surat, kepada, perihal, catatan, lampiran_url, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [tanggal_keluar, nomor_surat, kepada, perihal, catatan, lampiran_url, session.id]
      );
    }
  } catch (err) {
    if (err.code === "42P01") {
      return { error: "Tabel surat belum ada. Jalankan migration-v9.sql di Supabase." };
    }
    return { error: id ? "Gagal memperbarui surat keluar." : "Gagal menambah surat keluar." };
  }

  revalidateAgenda();
  return { success: true };
}

export async function deleteSuratKeluarAction(prevState, formData) {
  const session = await ensureAdminSession();
  if (!session) return { error: "Hanya admin yang dapat menghapus entri agenda." };

  const id = formData.get("id")?.toString().trim();
  if (!id) return { error: "ID tidak valid." };

  try {
    await query("DELETE FROM surat_keluar WHERE id = $1", [id]);
  } catch (err) {
    return { error: "Gagal menghapus surat keluar." };
  }

  revalidateAgenda();
  return { success: true };
}
