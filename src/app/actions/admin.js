"use server";

import { createAdminClient } from "@/lib/supabase";
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

  const db = createAdminClient();
  const { data } = await db
    .from("role_permissions")
    .select("allowed")
    .eq("role", session.role)
    .eq("permission_key", permissionKey)
    .maybeSingle();

  if (!data?.allowed) return null;
  return session;
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
  const key = CMS_PAGE_PERMISSION_MAP[page_key];
  if (!key) return null; // Reject unknown page keys instead of defaulting
  return key;
}

function revalidatePathsAfterCmsChange(page_key) {
  revalidatePath("/");
  revalidatePath("/home");
  revalidatePath("/anggota");
  revalidatePath("/admin/content");
  if (page_key === "daftar_ambalan") {
    revalidatePath("/daftar-ambalan");
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

  const db = createAdminClient();

  // Replies are cascaded by FK, so deleting parent auto-deletes replies
  const { error } = await db.from("comments").delete().eq("id", commentId);

  if (error) {
    console.error("deleteCommentAction:", error.message);
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

  const db = createAdminClient();
  const { error } = await db
    .from("comments")
    .update({ is_spam: !isSpam })
    .eq("id", commentId);

  if (error) return { error: "Gagal mengubah status komentar." };
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

  const db = createAdminClient();
  const { error } = await db
    .from("comments")
    .update({ is_pinned: !isPinned })
    .eq("id", commentId);

  if (error) return { error: "Gagal mengubah pin komentar." };
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

  const db = createAdminClient();
  const { data: maxRow } = await db
    .from("jabatan")
    .select("urutan")
    .order("urutan", { ascending: false })
    .limit(1)
    .maybeSingle();
  const urutan = (maxRow?.urutan ?? 0) + 1;

  const { error } = await db.from("jabatan").insert({ nama, urutan });
  if (error) {
    if (error.code === "23505")
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

  const db = createAdminClient();
  // Unassign first (on delete set null via FK, but just to be safe)
  await db
    .from("accounts")
    .update({ jabatan_id: null })
    .eq("jabatan_id", jabatanId);
  const { error } = await db.from("jabatan").delete().eq("id", jabatanId);
  if (error) return { error: "Gagal menghapus jabatan." };
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

  const jabatanId = formData.get("jabatan_id")?.toString();
  const direction = formData.get("direction")?.toString();
  if (!jabatanId || (direction !== "up" && direction !== "down")) {
    return { error: "Permintaan tidak valid." };
  }

  const db = createAdminClient();
  const { data: rows, error: listErr } = await db
    .from("jabatan")
    .select("id, urutan")
    .order("urutan", { ascending: true });

  if (listErr || !rows?.length) {
    return { error: "Gagal membaca daftar jabatan." };
  }

  const idx = rows.findIndex((r) => r.id === jabatanId);
  if (idx < 0) return { error: "Jabatan tidak ditemukan." };
  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= rows.length) {
    return { success: true };
  }

  const a = rows[idx];
  const b = rows[swapIdx];
  await db.from("jabatan").update({ urutan: b.urutan }).eq("id", a.id);
  await db.from("jabatan").update({ urutan: a.urutan }).eq("id", b.id);

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

  const db = createAdminClient();
  const { error } = await db
    .from("accounts")
    .update({ jabatan_id: jabatanId })
    .eq("id", accountId);

  if (error) return { error: "Gagal mengubah jabatan." };
  revalidatePath("/anggota");
  revalidatePath("/profil");
  return { success: true };
}

export async function updateRegistrationSettingAction(prevState, formData) {
  const session = await ensurePermission("settings.manage");
  if (!session) return { error: "Tidak punya izin untuk mengubah pengaturan ini." };

  const enabled = formData.get("enabled") === "true";
  const db = createAdminClient();
  const { error } = await db.from("site_settings").upsert(
    {
      key: "registration_enabled",
      value_json: { enabled },
      updated_by: session.id,
    },
    { onConflict: "key" },
  );

  if (error) return { error: "Gagal menyimpan pengaturan registrasi." };

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

  const db = createAdminClient();

  const { error: e1 } = await db.from("site_settings").upsert(
    {
      key: "ambalan_registration_enabled",
      value_json: { enabled: ambalanEnabled },
      updated_by: session.id,
    },
    { onConflict: "key" },
  );
  if (e1) return { error: "Gagal menyimpan toggle pendaftaran seleksi." };

  const { error: e2 } = await db.from("site_settings").upsert(
    {
      key: "masa_bakti",
      value_json: { display, period_key },
      updated_by: session.id,
    },
    { onConflict: "key" },
  );
  if (e2) return { error: "Gagal menyimpan masa bakti." };

  revalidatePath("/");
  revalidatePath("/home");
  revalidatePath("/daftar-ambalan");
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
  if (!permissionKey) return { error: "Page key tidak valid." };
  const session = await ensurePermission(permissionKey);
  if (!session) return { error: "Tidak punya izin untuk menyimpan konten." };

  const db = createAdminClient();
  const { error } = await db.from("cms_entries").upsert(
    {
      page_key,
      section_key,
      entry_key,
      payload: { text },
      is_published,
      sort_order: Number.isNaN(sort_order) ? 0 : sort_order,
      updated_by: session.id,
    },
    { onConflict: "page_key,section_key,entry_key" },
  );

  if (error) return { error: "Gagal menyimpan konten CMS." };

  revalidatePathsAfterCmsChange(page_key);
  return { success: "Konten CMS berhasil disimpan." };
}

/** Hapus satu entri CMS. Izin mengikuti page_key entri tersebut. */
export async function deleteCmsEntryAction(prevState, formData) {
  const entryId = formData.get("entry_id")?.toString().trim() ?? "";
  if (!entryId) return { error: "ID entri tidak valid." };

  const db = createAdminClient();
  const { data: row, error: fetchErr } = await db
    .from("cms_entries")
    .select("id, page_key")
    .eq("id", entryId)
    .maybeSingle();

  if (fetchErr || !row) return { error: "Entri tidak ditemukan." };

  const permKey = cmsPermissionKeyForPage(row.page_key);
  if (!permKey) return { error: "Page key entri tidak valid." };
  const session = await ensurePermission(permKey);
  if (!session) return { error: "Tidak punya izin untuk menghapus konten ini." };

  const { error } = await db.from("cms_entries").delete().eq("id", entryId);
  if (error) return { error: "Gagal menghapus entri CMS." };

  revalidatePathsAfterCmsChange(row.page_key);
  return { success: "Entri CMS berhasil dihapus." };
}

/** Alihkan draft / published tanpa membuka form penuh. */
export async function toggleCmsPublishedAction(prevState, formData) {
  const entryId = formData.get("entry_id")?.toString().trim() ?? "";
  if (!entryId) return { error: "ID entri tidak valid." };

  const db = createAdminClient();
  const { data: row, error: fetchErr } = await db
    .from("cms_entries")
    .select("id, page_key, is_published")
    .eq("id", entryId)
    .maybeSingle();

  if (fetchErr || !row) return { error: "Entri tidak ditemukan." };

  const permKey = cmsPermissionKeyForPage(row.page_key);
  if (!permKey) return { error: "Page key entri tidak valid." };
  const session = await ensurePermission(permKey);
  if (!session) return { error: "Tidak punya izin mengubah status publikasi." };

  const { error } = await db
    .from("cms_entries")
    .update({ is_published: !row.is_published, updated_by: session.id })
    .eq("id", entryId);

  if (error) return { error: "Gagal mengubah status publikasi." };

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

  const db = createAdminClient();
  const { data: maxRow } = await db
    .from("featured_programs")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const sort_order = (maxRow?.sort_order ?? 0) + 1;

  const { error } = await db.from("featured_programs").insert({
    title,
    description,
    sort_order,
    is_active: true,
  });
  if (error) {
    if (error.code === "42P01") {
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

  const db = createAdminClient();
  const { error } = await db.from("featured_programs").delete().eq("id", id);
  if (error) return { error: "Gagal menghapus program." };
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

  const db = createAdminClient();
  const { error } = await db
    .from("featured_programs")
    .update({ is_active })
    .eq("id", id);
  if (error) return { error: "Gagal memperbarui status." };
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

  const db = createAdminClient();
  const { data: rows, error: listErr } = await db
    .from("featured_programs")
    .select("id, sort_order")
    .order("sort_order", { ascending: true });

  if (listErr || !rows?.length) return { error: "Gagal membaca daftar program." };

  const idx = rows.findIndex((r) => r.id === id);
  if (idx < 0) return { error: "Program tidak ditemukan." };
  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= rows.length) return { success: true };

  const a = rows[idx];
  const b = rows[swapIdx];
  await db.from("featured_programs").update({ sort_order: b.sort_order }).eq("id", a.id);
  await db.from("featured_programs").update({ sort_order: a.sort_order }).eq("id", b.id);

  revalidatePath("/home");
  revalidatePath("/admin/programs");
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

  const db = createAdminClient();

  // Validate permission_key exists in the permission_keys table
  const { data: validKey } = await db
    .from("permission_keys")
    .select("key")
    .eq("key", permission_key)
    .maybeSingle();

  if (!validKey) {
    return { error: "Permission key tidak valid." };
  }

  const { error } = await db.from("role_permissions").upsert(
    { role, permission_key, allowed },
    { onConflict: "role,permission_key" },
  );

  if (error) return { error: "Gagal mengubah permission." };

  revalidatePath("/admin/permissions");
  return { success: true };
}
