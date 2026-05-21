import { query } from "./db";

// ─── Posts ────────────────────────────────────────────────────────────────

/** Fetch paginated published posts, optional category filter */
export async function getPosts({
  category = null,
  limit = 12,
  offset = 0,
  /** Kategori yang dikecualikan saat `category` null (mis. sembunyikan album dari tab "Semua"). */
  excludeCategory = null,
} = {}) {
  let sql = `
    SELECT
      p.id, p.title, p.slug, p.excerpt as description, p.category,
      p.featured_image_url as cover_image_url, p.event_date, p.event_location,
      p.created_at as published_at, p.created_at,
      CASE WHEN a.id IS NULL THEN NULL
        ELSE json_build_object(
          'display_name', a.display_name,
          'username', a.username,
          'profile_picture_url', a.profile_picture_url
        )
      END AS author,
      COALESCE(
        (SELECT json_agg(
          json_build_object(
            'id', pm.id,
            'media_type', pm.media_type,
            'url', pm.media_url,
            'caption', pm.caption,
            'order_index', pm.sort_order
          ) ORDER BY pm.sort_order
        ) FROM post_media pm WHERE pm.post_id = p.id),
        '[]'::json
      ) AS post_media
    FROM posts p
    LEFT JOIN accounts a ON a.id = p.author_id
    WHERE p.status = $1
  `;

  const params = ["published"];
  let idx = 2;

  if (category) {
    sql += ` AND p.category = $${idx++}`;
    params.push(category);
  } else if (excludeCategory) {
    sql += ` AND p.category != $${idx++}`;
    params.push(excludeCategory);
  }

  sql += ` ORDER BY p.created_at DESC LIMIT $${idx++} OFFSET $${idx++}`;
  params.push(limit, offset);

  try {
    const { rows } = await query(sql, params);
    return rows;
  } catch (err) {
    console.error("getPosts error:", err.message);
    return [];
  }
}

/** Fetch a single published post by slug, including media */
export async function getPostBySlug(slug) {
  const sql = `
    SELECT
      p.id, p.title, p.slug, p.excerpt as description, p.content, p.category, p.status,
      p.featured_image_url as cover_image_url, p.event_date, p.event_location,
      p.author_id, p.created_at, p.updated_at,
      CASE WHEN a.id IS NULL THEN NULL
        ELSE json_build_object(
          'display_name', a.display_name,
          'username', a.username,
          'profile_picture_url', a.profile_picture_url
        )
      END AS author,
      COALESCE(
        (SELECT json_agg(
          json_build_object(
            'id', pm.id,
            'media_type', pm.media_type,
            'url', pm.media_url,
            'caption', pm.caption,
            'order_index', pm.sort_order
          ) ORDER BY pm.sort_order
        ) FROM post_media pm WHERE pm.post_id = p.id),
        '[]'::json
      ) AS post_media
    FROM posts p
    LEFT JOIN accounts a ON a.id = p.author_id
    WHERE p.slug = $1
      AND p.status = $2
  `;

  try {
    const { rows } = await query(sql, [slug, "published"]);
    const post = rows[0] ?? null;
    return post;
  } catch (err) {
    console.error("getPostBySlug error:", err.message);
    return null;
  }
}

/** Recent posts for homepage (album galeri tidak ikut di sorotan berita landing). */
export async function getRecentPosts(limit = 6) {
  return getPosts({ limit, excludeCategory: "galeri" });
}

/** Program unggulan untuk blok home (admin kelola di /admin/programs). */
export async function getFeaturedProgramsForPublic(limit = 12) {
  const sql = `
    SELECT id, title, description, sort_order
    FROM featured_programs
    WHERE is_active = true
    ORDER BY sort_order ASC
    LIMIT $1
  `;

  try {
    const { rows } = await query(sql, [limit]);
    return rows;
  } catch (err) {
    if (err.code !== "42P01") {
      console.error("getFeaturedProgramsForPublic:", err.message);
    }
    return [];
  }
}

/** Upcoming kegiatan (event_date >= today) */
export async function getUpcomingKegiatan(limit = 5) {
  const today = new Date().toISOString().split("T")[0];
  const sql = `
    SELECT
      id, title, slug, excerpt as description, event_date, event_location, category,
      featured_image_url as cover_image_url, created_at as published_at
    FROM posts
    WHERE status = $1
      AND category = $2
      AND event_date >= $3
    ORDER BY event_date ASC
    LIMIT $4
  `;

  try {
    const { rows } = await query(sql, ["published", "kegiatan", today, limit]);
    return rows;
  } catch (err) {
    console.error("getUpcomingKegiatan error:", err.message);
    return [];
  }
}

/** Past kegiatan */
export async function getPastKegiatan(limit = 10) {
  const today = new Date().toISOString().split("T")[0];
  const sql = `
    SELECT
      id, title, slug, excerpt as description, event_date, event_location, featured_image_url as cover_image_url
    FROM posts
    WHERE status = $1
      AND category = $2
      AND event_date < $3
    ORDER BY event_date DESC
    LIMIT $4
  `;

  try {
    const { rows } = await query(sql, ["published", "kegiatan", today, limit]);
    return rows;
  } catch (err) {
    console.error("getPastKegiatan error:", err.message);
    return [];
  }
}

// ─── Accounts / Anggota ───────────────────────────────────────────────────

/** Fetch all jabatan (positions) sorted by urutan */
export async function getJabatanList() {
  const sql = `
    SELECT id, nama, urutan
    FROM jabatan
    ORDER BY urutan ASC
  `;

  try {
    const { rows } = await query(sql);
    return rows;
  } catch (err) {
    return [];
  }
}

/** Active accounts WITH jabatan set (for public anggota page) */
export async function getAnggota() {
  const sql = `
    SELECT
      a.id, a.display_name, a.username, a.role,
      a.profile_picture_url, a.bio, a.created_at,
      CASE WHEN j.id IS NULL THEN NULL
        ELSE json_build_object(
          'id', j.id,
          'nama', j.nama,
          'urutan', j.urutan
        )
      END AS jabatan
    FROM accounts a
    LEFT JOIN jabatan j ON j.id = a.jabatan_id
    WHERE a.is_active = true
      AND a.jabatan_id IS NOT NULL
    ORDER BY a.display_name ASC
  `;

  try {
    const { rows } = await query(sql);
    return rows;
  } catch (err) {
    console.error("getAnggota error:", err.message);
    return [];
  }
}

/** Single account by ID */
export async function getAccountById(id) {
  const sql = `
    SELECT id, display_name, username, role, profile_picture_url, bio, created_at
    FROM accounts
    WHERE id = $1
  `;

  try {
    const { rows } = await query(sql, [id]);
    return rows[0] ?? null;
  } catch (err) {
    return null;
  }
}

// ─── Gallery ──────────────────────────────────────────────────────────────

/** Images from published posts for the gallery page */
export async function getGallery(limit = 40) {
  const sql = `
    SELECT
      pm.id, pm.media_url as url, pm.caption, pm.sort_order as order_index,
      json_build_object(
        'id', p.id,
        'title', p.title,
        'slug', p.slug,
        'category', p.category,
        'status', p.status
      ) AS post
    FROM post_media pm
    INNER JOIN posts p ON p.id = pm.post_id
    WHERE pm.media_type = 'image'
      AND p.status = 'published'
    ORDER BY pm.created_at DESC
    LIMIT $1
  `;

  try {
    const { rows } = await query(sql, [limit]);
    return rows;
  } catch (err) {
    console.error("getGallery error:", err.message);
    return [];
  }
}

// ─── Comments ─────────────────────────────────────────────────────────────

/** Approved comments for a post, nested (max 1 level) */
export async function getComments(postId) {
  const sql = `
    SELECT
      c.id, c.content, c.created_at, c.is_pinned, c.parent_id,
      CASE WHEN a.id IS NULL THEN NULL
        ELSE json_build_object(
          'display_name', a.display_name,
          'username', a.username,
          'profile_picture_url', a.profile_picture_url
        )
      END AS author
    FROM comments c
    LEFT JOIN accounts a ON a.id = c.author_id
    WHERE c.post_id = $1
      AND c.is_spam = false
    ORDER BY c.is_pinned DESC, c.created_at ASC
  `;

  try {
    const { rows } = await query(sql, [postId]);
    const topLevel = rows.filter((c) => !c.parent_id);
    const replies = rows.filter((c) => !!c.parent_id);

    return topLevel.map((c) => ({
      ...c,
      replies: replies.filter((r) => r.parent_id === c.id),
    }));
  } catch (err) {
    console.error("getComments error:", err.message);
    return [];
  }
}

// ─── Notification helpers ───────────────────────────────────────────────────

/** Get emails of admin + moderator staff for notifications */
export async function getStaffEmails() {
  const sql = `
    SELECT email, display_name
    FROM accounts
    WHERE role = ANY($1)
      AND is_active = true
      AND email IS NOT NULL
  `;

  try {
    const { rows } = await query(sql, [["admin", "moderator"]]);
    return rows;
  } catch (err) {
    return [];
  }
}

/** Get all active user emails for post broadcast */
export async function getUsersWithEmail() {
  const sql = `
    SELECT email, display_name
    FROM accounts
    WHERE is_active = true
      AND email IS NOT NULL
  `;

  try {
    const { rows } = await query(sql);
    return rows;
  } catch (err) {
    return [];
  }
}

/** Post a comment (anonymous OK, author_id optional) */
export async function submitComment({
  postId,
  authorId = null,
  parentId = null,
  content,
}) {
  const sql = `
    INSERT INTO comments (post_id, author_id, parent_id, content)
    VALUES ($1, $2, $3, $4)
  `;

  try {
    await query(sql, [postId, authorId, parentId, content]);
  } catch (err) {
    throw new Error(err.message);
  }
}
