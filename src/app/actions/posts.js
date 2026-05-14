"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "./auth";
import { createAdminClient } from "@/lib/supabase";
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

async function uniqueSlug(db, base) {
  let slug = base;
  for (let i = 0; i < 20; i++) {
    const { data } = await db
      .from("posts")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (!data) return slug;
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

  const db = createAdminClient();
  const baseSlug = slugify(slugInput || title);
  const slug = await uniqueSlug(db, baseSlug);

  const { data: maxRow } = await db
    .from("posts")
    .select("post_number")
    .order("post_number", { ascending: false })
    .limit(1)
    .maybeSingle();
  const post_number = (maxRow?.post_number ?? 0) + 1;

  const now = new Date().toISOString();

  const insertPayload = {
    title,
    slug,
    description,
    content: content || null,
    category,
    status: "published",
    author_id: session.id,
    published_at: now,
    post_number,
    cover_image_url: null,
    event_date: category === "kegiatan" ? event_date : null,
    event_location: category === "kegiatan" ? event_location : null,
    achievement_level: null,
    achievement_rank: null,
  };

  const { data: post, error: insErr } = await db
    .from("posts")
    .insert(insertPayload)
    .select("id, title, slug, description, category")
    .single();

  if (insErr) {
    console.error("createAdminPostAction insert:", insErr.message, insErr);
    if (insErr.message?.includes("posts_category_check") || insErr.code === "23514") {
      return {
        error:
          "Kategori 'galeri' belum didukung database. Jalankan migration-v6.sql di Supabase.",
      };
    }
    return { error: "Gagal menyimpan postingan. Periksa data atau coba lagi." };
  }

  let order = 0;
  let coverUrl = null;
  for (let i = 0; i < imageUrls.length; i++) {
    const url = imageUrls[i];
    if (!coverUrl) coverUrl = url;
    const { error: mErr } = await db.from("post_media").insert({
      post_id: post.id,
      media_type: "image",
      url,
      thumbnail_url: null,
      caption: "",
      order_index: order++,
    });
    if (mErr) {
      console.error("post_media insert:", mErr.message);
      await db.from("posts").delete().eq("id", post.id);
      return { error: "Gagal menyimpan lampiran foto." };
    }
  }

  for (let i = 0; i < videoUrls.length; i++) {
    const url = videoUrls[i];
    const { error: mErr } = await db.from("post_media").insert({
      post_id: post.id,
      media_type: "video",
      url,
      thumbnail_url: null,
      caption: "",
      order_index: order++,
    });
    if (mErr) {
      console.error("post_media insert:", mErr.message);
      await db.from("posts").delete().eq("id", post.id);
      return { error: "Gagal menyimpan lampiran video." };
    }
  }

  if (coverUrl) {
    await db.from("posts").update({ cover_image_url: coverUrl }).eq("id", post.id);
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

/** Admin: Delete a post by ID */
export async function deletePostAction(postId) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return { error: "Hanya admin yang dapat menghapus postingan." };
  }

  const db = createAdminClient();
  const { error } = await db.from("posts").delete().eq("id", postId);

  if (error) {
    console.error("deletePostAction:", error.message);
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

  const db = createAdminClient();

  const { data: post, error: fetchErr } = await db
    .from("posts")
    .select("id, status")
    .eq("id", postId)
    .single();

  if (fetchErr || !post) {
    console.error("togglePostStatusAction fetch:", fetchErr?.message);
    return { error: "Postingan tidak ditemukan." };
  }

  const newStatus = post.status === "published" ? "draft" : "published";
  const published_at = newStatus === "published" ? new Date().toISOString() : null;

  const { error: updateErr } = await db
    .from("posts")
    .update({ status: newStatus, published_at })
    .eq("id", postId);

  if (updateErr) {
    console.error("togglePostStatusAction update:", updateErr.message);
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
