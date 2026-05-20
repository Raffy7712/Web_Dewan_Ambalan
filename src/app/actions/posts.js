"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "./auth";
import { query, getClient } from "@/lib/db";
import { getUsersWithEmail } from "@/lib/queries";
import { sendNewPostNotification } from "@/lib/email";
import {
  getDisplayUrl,
  parseMediaUrlLines,
} from "@/lib/media-url";

const MIN_POST_IMAGES = 1;
const MAX_POST_IMAGES = 10;
const MAX_POST_VIDEOS = 5;

function isValidHttpUrl(s) {
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function slugify(title) {
  const s = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/gi, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return s.length > 0 ? s.slice(0, 96) : "post";
}

async function uniqueSlug(base) {
  let slug = base;
  for (let i = 0; i < 20; i++) {
    const result = await query(
      "SELECT id FROM posts WHERE slug = $1",
      [slug]
    );
    if (!result.rows[0]) return slug;
    slug = `${base}-${Math.random().toString(36).slice(2, 6)}`;
  }
  return `${base}-${Date.now()}`;
}

export async function createAdminPostAction(prevState, formData) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return { error: "Hanya admin yang dapat mempublikasikan postingan." };
  }

  const postKind = formData.get("post_kind")?.toString() ?? "kegiatan";
  const category =
    postKind === "galeri"
      ? "galeri"
      : postKind === "kegiatan"
        ? "kegiatan"
        : postKind === "prestasi"
          ? "prestasi"
          : "pengumuman";

  const title = formData.get("title")?.toString().trim() ?? "";
  const description = formData.get("description")?.toString().trim() ?? "";
  const content = formData.get("content")?.toString().trim() ?? "";
  const slugInput = formData.get("slug")?.toString().trim() ?? "";
  const notifyEmail = formData.get("notify_email") === "on";

  const event_date =
    category === "kegiatan"
      ? (formData.get("event_date")?.toString().trim() ?? "")
      : "";
  const event_location =
    category === "kegiatan"
      ? (formData.get("event_location")?.toString().trim() ?? "")
      : "";

  if (!title) return { error: "Judul wajib diisi." };
  if (title.length > 200) return { error: "Judul terlalu panjang." };
  if (!description) return { error: "Ringkasan wajib diisi." };
  if (description.length > 500) return { error: "Ringkasan maksimal 500 karakter." };

  if (category === "kegiatan") {
    if (!event_date) return { error: "Tanggal kegiatan wajib diisi." };
    if (!/^\d{4}-\d{2}-\d{2}$/.test(event_date)) {
      return { error: "Format tanggal harus YYYY-MM-DD." };
    }
    if (!event_location) return { error: "Lokasi kegiatan wajib diisi." };
  }

  const imageLines = parseMediaUrlLines(
    formData.get("image_urls")?.toString() ?? "",
  );
  const videoLines = parseMediaUrlLines(
    formData.get("video_urls")?.toString() ?? "",
  );

  const seenImg = new Set();
  const imageUrls = [];
  for (const line of imageLines) {
    if (seenImg.has(line)) continue;
    seenImg.add(line);
    if (!isValidHttpUrl(line)) {
      return {
        error: `URL foto tidak valid (wajib http/https): ${line.slice(0, 80)}${line.length > 80 ? "…" : ""}`,
      };
    }
    imageUrls.push(getDisplayUrl(line));
  }

  if (imageUrls.length < MIN_POST_IMAGES) {
    return {
      error: `Wajib minimal ${MIN_POST_IMAGES} dan maksimal ${MAX_POST_IMAGES} URL foto (saat ini ${imageUrls.length}).`,
    };
  }
  if (imageUrls.length > MAX_POST_IMAGES) {
    return {
      error: `Maksimal ${MAX_POST_IMAGES} URL foto (saat ini ${imageUrls.length}).`,
    };
  }

  const seenVid = new Set();
  const videoUrls = [];
  for (const line of videoLines) {
    if (seenVid.has(line)) continue;
    seenVid.add(line);
    if (!isValidHttpUrl(line)) {
      return {
        error: `URL video tidak valid (wajib http/https): ${line.slice(0, 80)}${line.length > 80 ? "…" : ""}`,
      };
    }
    videoUrls.push(line.trim());
  }
  if (videoUrls.length > MAX_POST_VIDEOS) {
    return {
      error: `Maksimal ${MAX_POST_VIDEOS} URL video (saat ini ${videoUrls.length}).`,
    };
  }

  const baseSlug = slugify(slugInput || title);
  const slug = await uniqueSlug(baseSlug);

  const now = new Date().toISOString();

  const client = await getClient();
  let post;
  try {
    await client.query("BEGIN");

    // Get max post_number
    const maxResult = await client.query(
      "SELECT post_number FROM posts ORDER BY post_number DESC LIMIT 1"
    );
    const post_number = (maxResult.rows[0]?.post_number ?? 0) + 1;

    const insertResult = await client.query(
      `INSERT INTO posts (title, slug, description, content, category, status, author_id, published_at, post_number, cover_image_url, event_date, event_location, achievement_level, achievement_rank)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING id, title, slug, description, category`,
      [
        title, slug, description, content || null, category, "published",
        session.id, now, post_number, null,
        category === "kegiatan" ? event_date : null,
        category === "kegiatan" ? event_location : null,
        null, null,
      ]
    );
    post = insertResult.rows[0];

    let order = 0;
    let coverUrl = null;
    for (let i = 0; i < imageUrls.length; i++) {
      const url = imageUrls[i];
      if (!coverUrl) coverUrl = url;
      await client.query(
        "INSERT INTO post_media (post_id, media_type, url, thumbnail_url, caption, order_index) VALUES ($1, $2, $3, $4, $5, $6)",
        [post.id, "image", url, null, "", order++]
      );
    }

    for (let i = 0; i < videoUrls.length; i++) {
      const url = videoUrls[i];
      await client.query(
        "INSERT INTO post_media (post_id, media_type, url, thumbnail_url, caption, order_index) VALUES ($1, $2, $3, $4, $5, $6)",
        [post.id, "video", url, null, "", order++]
      );
    }

    if (coverUrl) {
      await client.query(
        "UPDATE posts SET cover_image_url = $1 WHERE id = $2",
        [coverUrl, post.id]
      );
    }

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("createAdminPostAction insert:", err.message, err);
    if (err.message?.includes("posts_category_check") || err.code === "23514") {
      return {
        error:
          "Kategori 'galeri' belum didukung database. Jalankan migration-v6.sql di Supabase.",
      };
    }
    return { error: "Gagal menyimpan postingan. Periksa data atau coba lagi." };
  } finally {
    client.release();
  }

  revalidatePath("/");
  revalidatePath("/berita");
  revalidatePath(`/berita/${post.slug}`);
  revalidatePath("/galeri");
  revalidatePath("/kegiatan");
  revalidatePath("/home");

  if (notifyEmail && process.env.RESEND_API_KEY) {
    const users = await getUsersWithEmail();
    const authorName =
      session.display_name ?? session.username ?? "Admin";
    sendNewPostNotification(users, {
      title: post.title,
      slug: post.slug,
      description: post.description,
      category: post.category,
      authorName,
    }).catch(() => {});
  }

  let message = "Postingan berhasil dipublikasikan.";
  if (notifyEmail && process.env.RESEND_API_KEY) {
    message = "Postingan dipublikasikan dan notifikasi email sedang dikirim.";
  } else if (notifyEmail && !process.env.RESEND_API_KEY) {
    message =
      "Postingan dipublikasikan. Notifikasi email dilewati (RESEND_API_KEY belum diset).";
  }

  return {
    success: true,
    slug: post.slug,
    message,
  };
}

/** Admin: Update an existing post */
export async function updateAdminPostAction(postId, prevState, formData) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return { error: "Hanya admin yang dapat mengubah postingan." };
  }

  const title = formData.get("title")?.toString().trim() ?? "";
  const description = formData.get("description")?.toString().trim() ?? "";
  const content = formData.get("content")?.toString().trim() ?? "";
  const notifyEmail = formData.get("notify_email") === "on";

  const event_date = formData.get("event_date")?.toString().trim() ?? "";
  const event_location = formData.get("event_location")?.toString().trim() ?? "";

  if (!title) return { error: "Judul wajib diisi." };
  if (title.length > 200) return { error: "Judul terlalu panjang." };
  if (!description) return { error: "Ringkasan wajib diisi." };
  if (description.length > 500) {
    return { error: "Ringkasan maksimal 500 karakter." };
  }

  let post;
  try {
    const result = await query(
      "SELECT id, category, slug, event_date, event_location, cover_image_url FROM posts WHERE id = $1",
      [postId]
    );
    post = result.rows[0] ?? null;
  } catch (err) {
    return { error: "Postingan tidak ditemukan." };
  }

  if (!post) {
    return { error: "Postingan tidak ditemukan." };
  }

  if (post.category === "kegiatan") {
    if (!event_date) return { error: "Tanggal kegiatan wajib diisi." };
    if (!/^\d{4}-\d{2}-\d{2}$/.test(event_date)) {
      return { error: "Format tanggal harus YYYY-MM-DD." };
    }
    if (!event_location) return { error: "Lokasi kegiatan wajib diisi." };
  }

  const imageLines = parseMediaUrlLines(
    formData.get("image_urls")?.toString() ?? "",
  );
  const videoLines = parseMediaUrlLines(
    formData.get("video_urls")?.toString() ?? "",
  );

  const seenImg = new Set();
  const imageUrls = [];
  for (const line of imageLines) {
    if (seenImg.has(line)) continue;
    seenImg.add(line);
    if (!isValidHttpUrl(line)) {
      return {
        error: `URL foto tidak valid (wajib http/https): ${line.slice(0, 80)}${line.length > 80 ? "…" : ""}`,
      };
    }
    imageUrls.push(getDisplayUrl(line));
  }

  if (imageUrls.length < MIN_POST_IMAGES) {
    return {
      error: `Wajib minimal ${MIN_POST_IMAGES} dan maksimal ${MAX_POST_IMAGES} URL foto (saat ini ${imageUrls.length}).`,
    };
  }
  if (imageUrls.length > MAX_POST_IMAGES) {
    return {
      error: `Maksimal ${MAX_POST_IMAGES} URL foto (saat ini ${imageUrls.length}).`,
    };
  }

  const seenVid = new Set();
  const videoUrls = [];
  for (const line of videoLines) {
    if (seenVid.has(line)) continue;
    seenVid.add(line);
    if (!isValidHttpUrl(line)) {
      return {
        error: `URL video tidak valid (wajib http/https): ${line.slice(0, 80)}${line.length > 80 ? "…" : ""}`,
      };
    }
    videoUrls.push(line.trim());
  }
  if (videoUrls.length > MAX_POST_VIDEOS) {
    return {
      error: `Maksimal ${MAX_POST_VIDEOS} URL video (saat ini ${videoUrls.length}).`,
    };
  }

  const client = await getClient();
  try {
    await client.query("BEGIN");

    await client.query(
      `UPDATE posts SET title = $1, description = $2, content = $3, event_date = $4, event_location = $5 WHERE id = $6`,
      [
        title, description, content || null,
        post.category === "kegiatan" ? event_date : null,
        post.category === "kegiatan" ? event_location : null,
        postId,
      ]
    );

    await client.query("DELETE FROM post_media WHERE post_id = $1", [postId]);

    let order = 0;
    let coverUrl = null;
    for (let i = 0; i < imageUrls.length; i++) {
      const url = imageUrls[i];
      if (!coverUrl) coverUrl = url;
      await client.query(
        "INSERT INTO post_media (post_id, media_type, url, thumbnail_url, caption, order_index) VALUES ($1, $2, $3, $4, $5, $6)",
        [postId, "image", url, null, "", order++]
      );
    }

    for (let i = 0; i < videoUrls.length; i++) {
      const url = videoUrls[i];
      await client.query(
        "INSERT INTO post_media (post_id, media_type, url, thumbnail_url, caption, order_index) VALUES ($1, $2, $3, $4, $5, $6)",
        [postId, "video", url, null, "", order++]
      );
    }

    if (coverUrl && coverUrl !== post.cover_image_url) {
      await client.query(
        "UPDATE posts SET cover_image_url = $1 WHERE id = $2",
        [coverUrl, postId]
      );
    }

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("updateAdminPostAction update:", err.message);
    return { error: "Gagal memperbarui postingan. Coba lagi." };
  } finally {
    client.release();
  }

  revalidatePath("/");
  revalidatePath("/berita");
  revalidatePath(`/berita/${post.slug}`);
  revalidatePath("/galeri");
  revalidatePath("/kegiatan");
  revalidatePath("/home");
  revalidatePath("/admin/posts");

  return {
    success: true,
    slug: post.slug,
    message: "Postingan berhasil diperbarui.",
  };
}

/** Admin: Delete a post by ID */
export async function deletePostAction(postId) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return { error: "Hanya admin yang dapat menghapus postingan." };
  }

  try {
    await query("DELETE FROM posts WHERE id = $1", [postId]);
  } catch (err) {
    console.error("deletePostAction:", err.message);
    return { error: "Gagal menghapus postingan. Coba lagi." };
  }

  revalidatePath("/");
  revalidatePath("/berita");
  revalidatePath("/galeri");
  revalidatePath("/kegiatan");
  revalidatePath("/home");
  revalidatePath("/admin/posts");

  return { success: true, message: "Postingan berhasil dihapus." };
}

/** Admin: Toggle post status (draft ↔ published) */
export async function togglePostStatusAction(postId) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return { error: "Hanya admin yang dapat mengubah status postingan." };
  }

  let post;
  try {
    const result = await query(
      "SELECT id, status FROM posts WHERE id = $1",
      [postId]
    );
    post = result.rows[0] ?? null;
  } catch (err) {
    console.error("togglePostStatusAction fetch:", err.message);
    return { error: "Postingan tidak ditemukan." };
  }

  if (!post) {
    return { error: "Postingan tidak ditemukan." };
  }

  const newStatus = post.status === "published" ? "draft" : "published";
  const published_at = newStatus === "published" ? new Date().toISOString() : null;

  try {
    await query(
      "UPDATE posts SET status = $1, published_at = $2 WHERE id = $3",
      [newStatus, published_at, postId]
    );
  } catch (err) {
    console.error("togglePostStatusAction update:", err.message);
    return { error: "Gagal mengubah status postingan." };
  }

  revalidatePath("/");
  revalidatePath("/berita");
  revalidatePath("/galeri");
  revalidatePath("/kegiatan");
  revalidatePath("/home");
  revalidatePath("/admin/posts");

  return {
    success: true,
    message: `Postingan berhasil diubah ke status: ${newStatus}.`,
    newStatus,
  };
}

export async function getAllAdminPostsAction() {
  try {
    const result = await query(
      `SELECT p.id, p.title, p.slug, p.category, p.status, p.published_at, p.created_at, p.author_id,
        json_build_object('display_name', a.display_name) AS accounts
      FROM posts p
      LEFT JOIN accounts a ON a.id = p.author_id
      ORDER BY p.created_at DESC`
    );
    return result.rows;
  } catch (err) {
    console.error("getAllAdminPostsAction:", err.message);
    return [];
  }
}
