"use server";

import { query } from "@/lib/db";
import { getSession } from "./auth";
import { revalidatePath } from "next/cache";

const STAFF_ROLES = ["admin", "moderator"];

async function ensureAdmin() {
  const session = await getSession();
  if (!session || session.role !== "admin") return null;
  return session;
}

async function ensurePermission(permissionKey) {
  const session = await getSession();
  if (!session) return null;
  if (session.role === "admin") return session;

  try {
    const result = await query(
      "SELECT allowed FROM role_permissions WHERE role = $1 AND permission_key = $2",
      [session.role, permissionKey]
    );
    const data = result.rows[0] ?? null;
    if (!data?.allowed) return null;
    return session;
  } catch (err) {
    return null;
  }
}

const CMS_PAGE_PERMISSION_MAP = {
  landing: "content.landing.manage",
  home: "content.home.manage",
  organization: "content.org.manage",
  footer: "content.footer.manage",
  daftar_ambalan: "content.daftar_ambalan.manage",
  kegiatan: "content.portal.manage",
  berita: "content.portal.manage",
  galeri: "content.portal.manage",
  keuangan: "content.portal.manage",
};

function cmsPermissionKeyForPage(page_key) {
  return CMS_PAGE_PERMISSION_MAP[page_key] ?? "content.landing.manage";
}

function revalidatePathsAfterCmsChange(page_key) {
  revalidatePath("/");
  revalidatePath("/home");
  revalidatePath("/anggota");
  revalidatePath("/admin/content");
  if (page_key === "daftar_ambalan") {
    revalidatePath("/daftar-calon-dewan-ambalan");
  }
  if (page_key === "organization") {
    revalidatePath("/profil");
  }
  if (page_key === "footer") {
    revalidatePath("/", "layout");
  }
  if (page_key === "kegiatan") {
    revalidatePath("/kegiatan");
  }
  if (page_key === "berita") {
    revalidatePath("/berita");
  }
  if (page_key === "galeri") {
    revalidatePath("/galeri");
  }
  if (page_key === "keuangan") {
    revalidatePath("/keuangan");
  }
}

// ─── Delete Comment ───────────────────────────────────────────────────────────

/**
 * Delete a comment (and its replies). Only admin/moderator can do this.
 */
export async function deleteCommentAction(prevState, formData) {
  const session = await getSession();
  if (!session || !STAFF_ROLES.includes(session.role)) {
    return { error: "Tidak punya izin untuk menghapus komentar." };
  }

  const commentId = formData.get("comment_id")?.toString();
  if (!commentId) return { error: "ID komentar tidak valid." };

  // Replies are cascaded by FK, so deleting parent auto-deletes replies
  try {
    await query("DELETE FROM comments WHERE id = $1", [commentId]);
  } catch (err) {
    console.error("deleteCommentAction:", err.message);
    return { error: "Gagal menghapus komentar." };
  }

  return { success: true, deletedId: commentId };
}

// ─── Toggle Spam ─────────────────────────────────────────────────────────────

/**
 * Mark/unmark a comment as spam. Only admin/moderator.
 */
export async function toggleSpamAction(prevState, formData) {
  const session = await getSession();
  if (!session || !STAFF_ROLES.includes(session.role)) {
    return { error: "Tidak punya izin." };
  }

  const commentId = formData.get("comment_id")?.toString();
  const isSpam = formData.get("is_spam") === "true";

  try {
    await query(
      "UPDATE comments SET is_spam = $1 WHERE id = $2",
      [!isSpam, commentId]
    );
  } catch (err) {
    return { error: "Gagal mengubah status komentar." };
  }
  return { success: true, newSpam: !isSpam };
}

// ─── Pin Comment ──────────────────────────────────────────────────────────────

/**
 * Pin/unpin a comment. Only admin/moderator.
 */
export async function togglePinAction(prevState, formData) {
  const session = await getSession();
  if (!session || !STAFF_ROLES.includes(session.role)) {
    return { error: "Tidak punya izin." };
  }

  const commentId = formData.get("comment_id")?.toString();
  const isPinned = formData.get("is_pinned") === "true";

  try {
    await query(
      "UPDATE comments SET is_pinned = $1 WHERE id = $2",
      [!isPinned, commentId]
    );
  } catch (err) {
    return { error: "Gagal mengubah pin komentar." };
  }
  return { success: true };
}

// ─── Jabatan Management ─────────────────────────────────────────────────────────────────

/** Tambah jabatan baru. Hanya admin. */
export async function addJabatanAction(prevState, formData) {
  const session = await getSession();
  if (!session || session.role !== "admin")
    return { error: "Hanya admin yang bisa menambah jabatan." };

  const nama = formData.get("nama")?.toString().trim() ?? "";

  if (!nama) return { error: "Nama jabatan wajib diisi." };

  let urutan;
  try {
    const maxResult = await query(
      "SELECT urutan FROM jabatan ORDER BY urutan DESC LIMIT 1"
    );
    const maxRow = maxResult.rows[0] ?? null;
    urutan = (maxRow?.urutan ?? 0) + 1;
  } catch {
    urutan = 1;
  }

  try {
    await query(
      "INSERT INTO jabatan (nama, urutan) VALUES ($1, $2)",
      [nama, urutan]
    );
  } catch (err) {
    if (err.code === "23505")
      return { error: "Jabatan dengan nama ini sudah ada." };
    return { error: "Gagal menambah jabatan." };
  }
  revalidatePath("/anggota");
  revalidatePath("/admin/jabatan");
  return { success: `Jabatan "${nama}" berhasil ditambahkan.` };
}

/** Hapus jabatan. Hanya admin. */
export async function deleteJabatanAction(prevState, formData) {
  const session = await getSession();
  if (!session || session.role !== "admin")
    return { error: "Hanya admin yang bisa menghapus jabatan." };

  const jabatanId = formData.get("jabatan_id")?.toString();
  if (!jabatanId) return { error: "ID jabatan tidak valid." };

  try {
    await query("UPDATE accounts SET jabatan_id = NULL WHERE jabatan_id = $1", [jabatanId]);
    await query("DELETE FROM jabatan WHERE id = $1", [jabatanId]);
  } catch (err) {
    return { error: "Gagal menghapus jabatan." };
  }
  revalidatePath("/anggota");
  revalidatePath("/admin/jabatan");
  return { success: true };
}

/** Ubah urutan jabatan via drag-and-drop. Hanya admin. */
export async function reorderJabatanDragAction(prevState, formData) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return { error: "Hanya admin yang bisa mengubah urutan jabatan." };
  }

  let items;
  try {
    items = JSON.parse(formData.get("items"));
  } catch {
    return { error: "Data urutan tidak valid." };
  }

  if (!Array.isArray(items) || items.length === 0) {
    return { error: "Data urutan tidak valid." };
  }

  try {
    const queryStr = items
      .map((_, i) => {
        const offset = i * 2;
        return `UPDATE jabatan SET urutan = $${offset + 1} WHERE id = $${offset + 2}`;
      })
      .join("; ");
    const params = items.flatMap((item, idx) => [idx + 1, item.id]);
    await query(queryStr, params);
  } catch (err) {
    return { error: "Gagal mengubah urutan jabatan." };
  }

  revalidatePath("/anggota");
  revalidatePath("/admin/jabatan");
  return { success: true };
}

/** Ubah urutan jabatan (swap dengan tetangga). Hanya admin. */
export async function reorderJabatanAction(prevState, formData) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return { error: "Hanya admin yang bisa mengubah urutan jabatan." };
  }

  let jabatanId, direction;
  if (formData instanceof FormData) {
    jabatanId = formData.get("jabatan_id")?.toString();
    direction = formData.get("direction")?.toString();
  } else {
    jabatanId = prevState;
    direction = formData;
  }
  if (!jabatanId || (direction !== "up" && direction !== "down")) {
    return { error: "Permintaan tidak valid." };
  }

  let rows;
  try {
    const result = await query(
      "SELECT id, urutan FROM jabatan ORDER BY urutan ASC"
    );
    rows = result.rows;
  } catch (err) {
    return { error: "Gagal membaca daftar jabatan." };
  }

  if (!rows?.length) {
    return { error: "Gagal membaca daftar jabatan." };
  }

  const idx = rows.findIndex((r) => r.id === jabatanId);
  if (idx < 0) return { error: "Jabatan tidak ditemukan." };
  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= rows.length) {
    return { success: true };
  }

  try {
    await query("UPDATE jabatan SET urutan = $1 WHERE id = $2", [rows[swapIdx].urutan, rows[idx].id]);
    await query("UPDATE jabatan SET urutan = $1 WHERE id = $2", [rows[idx].urutan, rows[swapIdx].id]);
  } catch (err) {
    return { error: "Gagal mengubah urutan jabatan." };
  }

  revalidatePath("/anggota");
  revalidatePath("/admin/jabatan");
  return { success: true };
}

/** Assign jabatan ke user. Hanya admin. */
export async function assignJabatanAction(prevState, formData) {
  const session = await getSession();
  if (!session || session.role !== "admin")
    return { error: "Hanya admin yang bisa mengatur jabatan anggota." };

  const accountId = formData.get("account_id")?.toString();
  const jabatanId = formData.get("jabatan_id")?.toString() || null; // null = hapus jabatan

  if (!accountId) return { error: "ID anggota tidak valid." };

  try {
    await query(
      "UPDATE accounts SET jabatan_id = $1 WHERE id = $2",
      [jabatanId, accountId]
    );
  } catch (err) {
    return { error: "Gagal mengubah jabatan." };
  }
  revalidatePath("/anggota");
  revalidatePath("/profil");
  return { success: true };
}

export async function updateRegistrationSettingAction(prevState, formData) {
  const session = await ensurePermission("settings.manage");
  if (!session) return { error: "Tidak punya izin untuk mengubah pengaturan ini." };

  const enabled = formData.get("enabled") === "true";
  try {
    await query(
      `INSERT INTO site_settings (key, value_json, updated_by) VALUES ($1, $2, $3)
       ON CONFLICT (key) DO UPDATE SET value_json = EXCLUDED.value_json, updated_by = EXCLUDED.updated_by`,
      ["registration_enabled", { enabled }, session.id]
    );
  } catch (err) {
    return { error: "Gagal menyimpan pengaturan registrasi." };
  }

  revalidatePath("/");
  revalidatePath("/register");
  revalidatePath("/admin");
  revalidatePath("/admin/settings");
  return { success: "Pengaturan registrasi berhasil diperbarui.", enabled };
}

/** Pendaftaran seleksi calon pengurus + masa bakti (site_settings). */
export async function updateAmbalanPortalSettingsAction(prevState, formData) {
  const session = await ensurePermission("settings.manage");
  if (!session) return { error: "Tidak punya izin untuk mengubah pengaturan ini." };

  const ambalanEnabled = formData.get("ambalan_enabled") === "on";
  const display =
    formData.get("masa_bakti_display")?.toString().trim() || "2026/2027";
  let period_key =
    formData.get("masa_bakti_period_key")?.toString().trim() || "2026-2027";
  period_key = period_key.replace(/\s+/g, "");

  try {
    await query(
      `INSERT INTO site_settings (key, value_json, updated_by) VALUES ($1, $2, $3)
       ON CONFLICT (key) DO UPDATE SET value_json = EXCLUDED.value_json, updated_by = EXCLUDED.updated_by`,
      ["ambalan_registration_enabled", { enabled: ambalanEnabled }, session.id]
    );

    await query(
      `INSERT INTO site_settings (key, value_json, updated_by) VALUES ($1, $2, $3)
       ON CONFLICT (key) DO UPDATE SET value_json = EXCLUDED.value_json, updated_by = EXCLUDED.updated_by`,
      ["masa_bakti", { display, period_key }, session.id]
    );
  } catch (err) {
    if (err.message?.includes("ambalan_registration_enabled")) {
      return { error: "Gagal menyimpan toggle pendaftaran seleksi." };
    }
    return { error: "Gagal menyimpan masa bakti." };
  }

  revalidatePath("/");
  revalidatePath("/home");
  revalidatePath("/daftar-calon-dewan-ambalan");
  revalidatePath("/anggota");
  revalidatePath("/admin/settings");
  return {
    success: "Pengaturan portal seleksi berhasil disimpan.",
    ambalanEnabled,
    masaBaktiDisplay: display,
    masaBaktiPeriodKey: period_key,
  };
}

export async function saveCmsEntryAction(prevState, formData) {
  const page_key = formData.get("page_key")?.toString().trim() ?? "";
  const section_key = formData.get("section_key")?.toString().trim() ?? "";
  const entry_key = formData.get("entry_key")?.toString().trim() ?? "";
  const text = formData.get("text")?.toString() ?? "";
  const is_published = formData.get("is_published") === "true";
  const sort_order = Number.parseInt(formData.get("sort_order")?.toString() ?? "0", 10);

  if (!page_key || !section_key || !entry_key) {
    return { error: "Page, section, dan entry key wajib diisi." };
  }

  const permissionKey = cmsPermissionKeyForPage(page_key);
  const session = await ensurePermission(permissionKey);
  if (!session) return { error: "Tidak punya izin untuk menyimpan konten." };

  try {
    await query(
      `INSERT INTO cms_entries (page_key, section_key, entry_key, payload, is_published, sort_order, updated_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (page_key, section_key, entry_key) DO UPDATE SET
         payload = EXCLUDED.payload, is_published = EXCLUDED.is_published,
         sort_order = EXCLUDED.sort_order, updated_by = EXCLUDED.updated_by`,
      [page_key, section_key, entry_key, { text }, is_published, Number.isNaN(sort_order) ? 0 : sort_order, session.id]
    );
  } catch (err) {
    return { error: "Gagal menyimpan konten CMS." };
  }

  revalidatePathsAfterCmsChange(page_key);
  return { success: "Konten CMS berhasil disimpan." };
}

/** Hapus satu entri CMS. Izin mengikuti page_key entri tersebut. */
export async function deleteCmsEntryAction(prevState, formData) {
  const entryId = formData.get("entry_id")?.toString().trim() ?? "";
  if (!entryId) return { error: "ID entri tidak valid." };

  let row;
  try {
    const result = await query(
      "SELECT id, page_key FROM cms_entries WHERE id = $1",
      [entryId]
    );
    row = result.rows[0] ?? null;
  } catch (err) {
    return { error: "Entri tidak ditemukan." };
  }

  if (!row) return { error: "Entri tidak ditemukan." };

  const session = await ensurePermission(cmsPermissionKeyForPage(row.page_key));
  if (!session) return { error: "Tidak punya izin untuk menghapus konten ini." };

  try {
    await query("DELETE FROM cms_entries WHERE id = $1", [entryId]);
  } catch (err) {
    return { error: "Gagal menghapus entri CMS." };
  }

  revalidatePathsAfterCmsChange(row.page_key);
  return { success: "Entri CMS berhasil dihapus." };
}

/** Alihkan draft / published tanpa membuka form penuh. */
export async function toggleCmsPublishedAction(prevState, formData) {
  const entryId = formData.get("entry_id")?.toString().trim() ?? "";
  if (!entryId) return { error: "ID entri tidak valid." };

  let row;
  try {
    const result = await query(
      "SELECT id, page_key, is_published FROM cms_entries WHERE id = $1",
      [entryId]
    );
    row = result.rows[0] ?? null;
  } catch (err) {
    return { error: "Entri tidak ditemukan." };
  }

  if (!row) return { error: "Entri tidak ditemukan." };

  const session = await ensurePermission(cmsPermissionKeyForPage(row.page_key));
  if (!session) return { error: "Tidak punya izin mengubah status publikasi." };

  try {
    await query(
      "UPDATE cms_entries SET is_published = $1, updated_by = $2 WHERE id = $3",
      [!row.is_published, session.id, entryId]
    );
  } catch (err) {
    return { error: "Gagal mengubah status publikasi." };
  }

  revalidatePathsAfterCmsChange(row.page_key);
  return { success: true, is_published: !row.is_published };
}

// ─── Program unggulan (featured_programs) ─────────────────────────────────

export async function addFeaturedProgramAction(prevState, formData) {
  const session = await ensureAdmin();
  if (!session) return { error: "Hanya admin yang bisa mengubah program unggulan." };

  const title = formData.get("title")?.toString().trim() ?? "";
  const description = formData.get("description")?.toString().trim() ?? "";
  if (!title) return { error: "Judul wajib diisi." };

  let sort_order;
  try {
    const maxResult = await query(
      "SELECT sort_order FROM featured_programs ORDER BY sort_order DESC LIMIT 1"
    );
    const maxRow = maxResult.rows[0] ?? null;
    sort_order = (maxRow?.sort_order ?? 0) + 1;
  } catch {
    sort_order = 1;
  }

  try {
    await query(
      "INSERT INTO featured_programs (title, description, sort_order, is_active) VALUES ($1, $2, $3, $4)",
      [title, description, sort_order, true]
    );
  } catch (err) {
    if (err.code === "42P01") {
      return { error: "Tabel program unggulan belum ada. Jalankan migration-v5.sql." };
    }
    return { error: "Gagal menambah program." };
  }
  revalidatePath("/home");
  revalidatePath("/admin/programs");
  return { success: "Program berhasil ditambahkan." };
}

export async function deleteFeaturedProgramAction(prevState, formData) {
  const session = await ensureAdmin();
  if (!session) return { error: "Hanya admin yang bisa menghapus program unggulan." };

  const id = formData.get("id")?.toString();
  if (!id) return { error: "ID tidak valid." };

  try {
    await query("DELETE FROM featured_programs WHERE id = $1", [id]);
  } catch (err) {
    return { error: "Gagal menghapus program." };
  }
  revalidatePath("/home");
  revalidatePath("/admin/programs");
  return { success: true };
}

export async function toggleFeaturedProgramAction(prevState, formData) {
  const session = await ensureAdmin();
  if (!session) return { error: "Hanya admin yang bisa mengubah program unggulan." };

  const id = formData.get("id")?.toString();
  const is_active = formData.get("is_active") === "true";
  if (!id) return { error: "ID tidak valid." };

  try {
    await query(
      "UPDATE featured_programs SET is_active = $1 WHERE id = $2",
      [is_active, id]
    );
  } catch (err) {
    return { error: "Gagal memperbarui status." };
  }
  revalidatePath("/home");
  revalidatePath("/admin/programs");
  return { success: true };
}

export async function moveFeaturedProgramAction(prevState, formData) {
  const session = await ensureAdmin();
  if (!session) return { error: "Hanya admin yang bisa mengubah urutan program." };

  const id = formData.get("id")?.toString();
  const direction = formData.get("direction")?.toString();
  if (!id || (direction !== "up" && direction !== "down")) {
    return { error: "Permintaan tidak valid." };
  }

  let rows;
  try {
    const result = await query(
      "SELECT id, sort_order FROM featured_programs ORDER BY sort_order ASC"
    );
    rows = result.rows;
  } catch (err) {
    return { error: "Gagal membaca daftar program." };
  }

  if (!rows?.length) return { error: "Gagal membaca daftar program." };

  const idx = rows.findIndex((r) => r.id === id);
  if (idx < 0) return { error: "Program tidak ditemukan." };
  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= rows.length) return { success: true };

  try {
    await query("UPDATE featured_programs SET sort_order = $1 WHERE id = $2", [rows[swapIdx].sort_order, rows[idx].id]);
    await query("UPDATE featured_programs SET sort_order = $1 WHERE id = $2", [rows[idx].sort_order, rows[swapIdx].id]);
  } catch (err) {
    return { error: "Gagal mengubah urutan program." };
  }

  revalidatePath("/home");
  revalidatePath("/admin/programs");
  return { success: true };
}

// ─── Org Members (custom names per jabatan) ───────────────────────────────

export async function saveOrgMemberAction(prevState, formData) {
  const session = await ensureAdmin();
  if (!session) return { error: "Hanya admin." };

  const id = formData.get("id")?.toString() || null;
  const jabatan_id = formData.get("jabatan_id")?.toString() ?? "";
  const nama = formData.get("nama")?.toString().trim() ?? "";

  if (!jabatan_id || !nama) return { error: "Jabatan dan nama wajib diisi." };

  try {
    if (id) {
      await query("UPDATE org_members SET nama = $1 WHERE id = $2", [nama, id]);
    } else {
      const { rows } = await query(
        "SELECT COALESCE(MAX(sort_order), -1) + 1 AS next FROM org_members WHERE jabatan_id = $1",
        [jabatan_id]
      );
      const nextSort = rows[0]?.next ?? 0;
      await query(
        "INSERT INTO org_members (jabatan_id, nama, sort_order) VALUES ($1, $2, $3)",
        [jabatan_id, nama, nextSort]
      );
    }
  } catch (err) {
    return { error: "Gagal menyimpan." };
  }

  revalidatePath("/anggota");
  revalidatePath("/admin/jabatan");
  return { success: true };
}

export async function deleteOrgMemberAction(prevState, formData) {
  const session = await ensureAdmin();
  if (!session) return { error: "Hanya admin." };

  const id = formData.get("id")?.toString();
  if (!id) return { error: "ID tidak valid." };

  try {
    await query("DELETE FROM org_members WHERE id = $1", [id]);
  } catch {
    return { error: "Gagal menghapus." };
  }

  revalidatePath("/anggota");
  revalidatePath("/admin/jabatan");
  return { success: true };
}

export async function reorderOrgMemberAction(prevState, formData) {
  const session = await ensureAdmin();
  if (!session) return { error: "Hanya admin." };

  const id = formData.get("id")?.toString();
  const direction = formData.get("direction")?.toString();
  const jabatan_id = formData.get("jabatan_id")?.toString();
  if (!id || !direction || !jabatan_id) return { error: "Data tidak valid." };

  let rows;
  try {
    const { rows: r } = await query(
      "SELECT id, sort_order FROM org_members WHERE jabatan_id = $1 ORDER BY sort_order ASC",
      [jabatan_id]
    );
    rows = r;
  } catch {
    return { error: "Gagal membaca." };
  }

  const idx = rows.findIndex((r) => r.id === id);
  if (idx < 0) return { error: "Tidak ditemukan." };
  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= rows.length) return { success: true };

  try {
    await query("UPDATE org_members SET sort_order = $1 WHERE id = $2", [rows[swapIdx].sort_order, rows[idx].id]);
    await query("UPDATE org_members SET sort_order = $1 WHERE id = $2", [rows[idx].sort_order, rows[swapIdx].id]);
  } catch {
    return { error: "Gagal mengubah urutan." };
  }

  revalidatePath("/anggota");
  revalidatePath("/admin/jabatan");
  return { success: true };
}

export async function reorderOrgMemberDragAction(prevState, formData) {
  const session = await ensureAdmin();
  if (!session) return { error: "Hanya admin." };

  let items;
  try {
    items = JSON.parse(formData.get("items"));
  } catch {
    return { error: "Data urutan tidak valid." };
  }

  if (!Array.isArray(items) || items.length === 0) {
    return { error: "Data urutan tidak valid." };
  }

  try {
    const q = items
      .map((_, i) => `UPDATE org_members SET sort_order = $${i * 2 + 1} WHERE id = $${i * 2 + 2}`)
      .join("; ");
    const params = items.flatMap((item, idx) => [idx + 1, item.id]);
    await query(q, params);
  } catch (err) {
    return { error: "Gagal mengubah urutan." };
  }

  revalidatePath("/anggota");
  return { success: true };
}

export async function setRolePermissionAction(prevState, formData) {
  const session = await ensurePermission("roles.manage");
  if (!session) return { error: "Tidak punya izin untuk mengatur permission." };

  const role = formData.get("role")?.toString() ?? "";
  const permission_key = formData.get("permission_key")?.toString() ?? "";
  const allowed = formData.get("allowed") === "true";

  if (!role || !permission_key) {
    return { error: "Role dan permission key wajib diisi." };
  }

  try {
    await query(
      `INSERT INTO role_permissions (role, permission_key, allowed) VALUES ($1, $2, $3)
       ON CONFLICT (role, permission_key) DO UPDATE SET allowed = EXCLUDED.allowed`,
      [role, permission_key, allowed]
    );
  } catch (err) {
    return { error: "Gagal mengubah permission." };
  }

  revalidatePath("/admin/permissions");
  return { success: true };
}
