"use server";

import { createAdminClient } from "@/lib/supabase";
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

  const db = createAdminClient();
  const { data, error } = await db
    .from("surat_masuk")
    .select(
      "id, tanggal_diterima, nomor_surat, tanggal_surat, dari, perihal, catatan, lampiran_url, created_at",
    )
    .order("tanggal_diterima", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getSuratMasukList:", error.message);
    return [];
  }
  return data ?? [];
}

export async function getSuratKeluarList() {
  const session = await ensureAdminSession();
  if (!session) return [];

  const db = createAdminClient();
  const { data, error } = await db
    .from("surat_keluar")
    .select(
      "id, tanggal_keluar, nomor_surat, kepada, perihal, catatan, lampiran_url, created_at",
    )
    .order("tanggal_keluar", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getSuratKeluarList:", error.message);
    return [];
  }
  return data ?? [];
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

  const db = createAdminClient();
  const row = {
    tanggal_diterima,
    nomor_surat,
    tanggal_surat: tanggal_surat || null,
    dari,
    perihal,
    catatan,
    lampiran_url,
  };

  if (id) {
    const { error } = await db.from("surat_masuk").update(row).eq("id", id);
    if (error) {
      if (error.code === "42P01") {
        return { error: "Tabel surat belum ada. Jalankan migration-v9.sql di Supabase." };
      }
      return { error: "Gagal memperbarui surat masuk." };
    }
  } else {
    const { error } = await db.from("surat_masuk").insert({
      ...row,
      created_by: session.id,
    });
    if (error) {
      if (error.code === "42P01") {
        return { error: "Tabel surat belum ada. Jalankan migration-v9.sql di Supabase." };
      }
      return { error: "Gagal menambah surat masuk." };
    }
  }

  revalidateAgenda();
  return { success: true };
}

export async function deleteSuratMasukAction(prevState, formData) {
  const session = await ensureAdminSession();
  if (!session) return { error: "Hanya admin yang dapat menghapus entri agenda." };

  const id = formData.get("id")?.toString().trim();
  if (!id) return { error: "ID tidak valid." };

  const db = createAdminClient();
  const { error } = await db.from("surat_masuk").delete().eq("id", id);
  if (error) return { error: "Gagal menghapus surat masuk." };

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

  const db = createAdminClient();
  const row = {
    tanggal_keluar,
    nomor_surat,
    kepada,
    perihal,
    catatan,
    lampiran_url,
  };

  if (id) {
    const { error } = await db.from("surat_keluar").update(row).eq("id", id);
    if (error) {
      if (error.code === "42P01") {
        return { error: "Tabel surat belum ada. Jalankan migration-v9.sql di Supabase." };
      }
      return { error: "Gagal memperbarui surat keluar." };
    }
  } else {
    const { error } = await db.from("surat_keluar").insert({
      ...row,
      created_by: session.id,
    });
    if (error) {
      if (error.code === "42P01") {
        return { error: "Tabel surat belum ada. Jalankan migration-v9.sql di Supabase." };
      }
      return { error: "Gagal menambah surat keluar." };
    }
  }

  revalidateAgenda();
  return { success: true };
}

export async function deleteSuratKeluarAction(prevState, formData) {
  const session = await ensureAdminSession();
  if (!session) return { error: "Hanya admin yang dapat menghapus entri agenda." };

  const id = formData.get("id")?.toString().trim();
  if (!id) return { error: "ID tidak valid." };

  const db = createAdminClient();
  const { error } = await db.from("surat_keluar").delete().eq("id", id);
  if (error) return { error: "Gagal menghapus surat keluar." };

  revalidateAgenda();
  return { success: true };
}
