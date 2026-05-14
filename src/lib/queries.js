import { createAdminClient } from "./supabase";

// ─── Posts ────────────────────────────────────────────────────────────────

/** Fetch paginated published posts, optional category filter */
export async function getPosts({
  category = null,
  limit = 12,
  offset = 0,
  /** Kategori yang dikecualikan saat `category` null (mis. sembunyikan album dari tab "Semua"). */
  excludeCategory = null,
} = {}) {
  const db = createAdminClient();
  let query = db
    .from("posts")
    .select(
      `id, post_number, title, slug, description, category,
       cover_image_url, event_date, event_location,
       achievement_level, achievement_rank,
       published_at, created_at,
       author:accounts(display_name, username, profile_picture_url)`,
    )
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (category) query = query.eq("category", category);
  else if (excludeCategory) query = query.neq("category", excludeCategory);

  const { data, error } = await query;
  if (error) {
    console.error("getPosts error:", error.message);
    return [];
  }
  return data ?? [];
}

/** Fetch a single published post by slug, including media */
export async function getPostBySlug(slug) {
  const db = createAdminClient();
  const { data: post, error } = await db
    .from("posts")
    .select(
      `*, author:accounts(display_name, username, profile_picture_url),
       post_media(id, media_type, url, thumbnail_url, caption, order_index)`,
    )
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (error) {
    console.error("getPostBySlug error:", error.message);
    return null;
  }
  if (post?.post_media) {
    post.post_media = post.post_media.sort(
      (a, b) => a.order_index - b.order_index,
    );
  }
  return post;
}

/** Recent posts for homepage (album galeri tidak ikut di sorotan berita landing). */
export async function getRecentPosts(limit = 6) {
  return getPosts({ limit, excludeCategory: "galeri" });
}

/** Program unggulan untuk blok home (admin kelola di /admin/programs). */
export async function getFeaturedProgramsForPublic(limit = 12) {
  const db = createAdminClient();
  const { data, error } = await db
    .from("featured_programs")
    .select("id, title, description, sort_order")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .limit(limit);

  if (error) {
    if (error.code !== "42P01") {
      console.error("getFeaturedProgramsForPublic:", error.message);
    }
    return [];
  }
  return data ?? [];
}

/** Upcoming kegiatan (event_date >= today) */
export async function getUpcomingKegiatan(limit = 5) {
  const db = createAdminClient();
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await db
    .from("posts")
    .select(
      `id, title, slug, description, event_date, event_location, category,
       cover_image_url, published_at`,
    )
    .eq("status", "published")
    .eq("category", "kegiatan")
    .gte("event_date", today)
    .order("event_date", { ascending: true })
    .limit(limit);

  if (error) {
    console.error("getUpcomingKegiatan error:", error.message);
    return [];
  }
  return data ?? [];
}

/** Past kegiatan */
export async function getPastKegiatan(limit = 10) {
  const db = createAdminClient();
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await db
    .from("posts")
    .select(
      `id, title, slug, description, event_date, event_location, cover_image_url`,
    )
    .eq("status", "published")
    .eq("category", "kegiatan")
    .lt("event_date", today)
    .order("event_date", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("getPastKegiatan error:", error.message);
    return [];
  }
  return data ?? [];
}

// ─── Accounts / Anggota ───────────────────────────────────────────────────

/** Fetch all jabatan (positions) sorted by urutan */
export async function getJabatanList() {
  const db = createAdminClient();
  const { data, error } = await db
    .from("jabatan")
    .select("id, nama, urutan")
    .order("urutan", { ascending: true });
  if (error) return [];
  return data ?? [];
}

/** Active accounts WITH jabatan set (for public anggota page) */
export async function getAnggota() {
  const db = createAdminClient();
  const { data, error } = await db
    .from("accounts")
    .select(
      `id, display_name, username, role, profile_picture_url, bio, created_at,
       jabatan:jabatan(id, nama, urutan)`,
    )
    .eq("is_active", true)
    .not("jabatan_id", "is", null)
    .order("display_name", { ascending: true });

  if (error) {
    console.error("getAnggota error:", error.message);
    return [];
  }
  return data ?? [];
}

/** Single account by ID */
export async function getAccountById(id) {
  const db = createAdminClient();
  const { data, error } = await db
    .from("accounts")
    .select(
      "id, display_name, username, role, profile_picture_url, bio, created_at",
    )
    .eq("id", id)
    .single();
  if (error) return null;
  return data;
}

// ─── Gallery ──────────────────────────────────────────────────────────────

/** Images from published posts for the gallery page */
export async function getGallery(limit = 40) {
  const db = createAdminClient();
  const { data, error } = await db
    .from("post_media")
    .select(
      `id, url, caption, order_index,
       post:posts!inner(id, title, slug, category, status)`,
    )
    .eq("media_type", "image")
    .eq("post.status", "published")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("getGallery error:", error.message);
    return [];
  }
  return data ?? [];
}

// ─── Comments ─────────────────────────────────────────────────────────────

/** Approved comments for a post, nested (max 1 level) */
export async function getComments(postId) {
  const db = createAdminClient();
  const { data, error } = await db
    .from("comments")
    .select(
      `id, content, created_at, is_pinned, parent_id,
       author:accounts(display_name, username, profile_picture_url)`,
    )
    .eq("post_id", postId)
    .eq("is_spam", false)
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("getComments error:", error.message);
    return [];
  }

  const all = data ?? [];
  const topLevel = all.filter((c) => !c.parent_id);
  const replies = all.filter((c) => !!c.parent_id);

  return topLevel.map((c) => ({
    ...c,
    replies: replies.filter((r) => r.parent_id === c.id),
  }));
}

// ─── Notification helpers ───────────────────────────────────────────────────

/** Get emails of admin + moderator staff for notifications */
export async function getStaffEmails() {
  const db = createAdminClient();
  const { data } = await db
    .from("accounts")
    .select("email, display_name")
    .in("role", ["admin", "moderator"])
    .eq("is_active", true)
    .not("email", "is", null);
  return data ?? [];
}

/** Get all active user emails for post broadcast */
export async function getUsersWithEmail() {
  const db = createAdminClient();
  const { data } = await db
    .from("accounts")
    .select("email, display_name")
    .eq("is_active", true)
    .not("email", "is", null);
  return data ?? [];
}

/** Post a comment (anonymous OK, author_id optional) */
export async function submitComment({
  postId,
  authorId = null,
  parentId = null,
  content,
}) {
  const db = createAdminClient();
  const { error } = await db.from("comments").insert({
    post_id: postId,
    author_id: authorId,
    parent_id: parentId,
    content,
    is_approved: false,
  });
  if (error) throw new Error(error.message);
}
