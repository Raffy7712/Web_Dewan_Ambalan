import { query } from "./db";

export async function getAllActiveAccountsForAdmin() {
  try {
    const { rows } = await query(
      `SELECT a.id, a.display_name, a.username, a.role, a.jabatan_id, a.is_active, a.banned,
        json_build_object('id', j.id, 'nama', j.nama, 'urutan', j.urutan) AS jabatan
       FROM accounts a
       LEFT JOIN jabatan j ON a.jabatan_id = j.id
       WHERE a.is_active = true AND a.banned = false
       ORDER BY a.display_name ASC`,
      []
    );
    return rows ?? [];
  } catch (err) {
    console.error("getAllActiveAccountsForAdmin:", err.message);
    return [];
  }
}

/** Admin: daftar akun untuk kelola ban (tanpa password). */
export async function getAccountsForAdminList() {
  try {
    const { rows } = await query(
      `SELECT id, display_name, username, email, role, is_active, banned, banned_at, banned_reason, created_at
       FROM accounts
       ORDER BY created_at DESC`,
      []
    );
    return rows ?? [];
  } catch (err) {
    console.error("getAccountsForAdminList:", err.message);
    return [];
  }
}

/**
 * Ringkasan traffic dari page_view_logs (butuh migration-v7).
 * @returns {Promise<{ ok: boolean, error?: string, totals?: object, byDay?: object[], topPaths?: {path:string,count:number}[] }>}
 */
export async function getPageViewAnalytics() {
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const since7d = new Date(now - 7 * dayMs).toISOString();

  let rows;
  try {
    const result = await query(
      `SELECT path, created_at FROM page_view_logs WHERE created_at >= $1 LIMIT 20000`,
      [since7d]
    );
    rows = result.rows ?? [];
  } catch (err) {
    if (err.message?.includes("page_view_logs")) {
      return {
        ok: false,
        error:
          "Tabel page_view_logs belum ada. Jalankan migration-v7.sql di database.",
      };
    }
    return { ok: false, error: err.message };
  }

  const last24h = rows.filter((r) => r.created_at >= since24h).length;
  const byDayMap = new Map();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now - i * dayMs);
    const key = d.toISOString().slice(0, 10);
    byDayMap.set(key, 0);
  }
  const pathCount = new Map();
  for (const r of rows) {
    const day = r.created_at?.slice(0, 10);
    if (day && byDayMap.has(day)) byDayMap.set(day, (byDayMap.get(day) ?? 0) + 1);
    const p = r.path || "/";
    pathCount.set(p, (pathCount.get(p) ?? 0) + 1);
  }
  const byDay = [...byDayMap.entries()].map(([date, count]) => ({
    date,
    count,
  }));
  const topPaths = [...pathCount.entries()]
    .map(([path, count]) => ({ path, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  return {
    ok: true,
    totals: {
      last7d: rows.length,
      last24h,
    },
    byDay,
    topPaths,
  };
}

export async function getMyAmbalanApplication(accountId, period = "2026-2027") {
  try {
    const { rows } = await query(
      `SELECT id, full_name, class_name, phone, motivation, experience, status, period, created_at, reviewed_at
       FROM ambalan_applications
       WHERE account_id = $1 AND period = $2`,
      [accountId, period]
    );
    return rows[0] ?? null;
  } catch (err) {
    if (!err.message?.includes("ambalan_applications")) {
      console.error("getMyAmbalanApplication:", err.message);
    }
    return null;
  }
}

export async function getRegistrationSetting() {
  try {
    const { rows } = await query(
      `SELECT value_json FROM site_settings WHERE key = $1`,
      ["registration_enabled"]
    );
    const data = rows[0] ?? null;
    return data?.value_json?.enabled !== false;
  } catch {
    return true;
  }
}

export async function getAmbalanRegistrationSetting() {
  try {
    const { rows } = await query(
      `SELECT value_json FROM site_settings WHERE key = $1`,
      ["ambalan_registration_enabled"]
    );
    const data = rows[0] ?? null;
    return data?.value_json?.enabled !== false;
  } catch {
    return false;
  }
}

export async function getMasaBaktiSetting() {
  try {
    const { rows } = await query(
      `SELECT value_json FROM site_settings WHERE key = $1`,
      ["masa_bakti"]
    );
    const data = rows[0] ?? null;
    const j = data?.value_json ?? {};
    return {
      display:
        typeof j.display === "string" && j.display.length > 0
          ? j.display
          : "2026/2027",
      period_key:
        typeof j.period_key === "string" && j.period_key.length > 0
          ? j.period_key
          : "2026-2027",
    };
  } catch {
    return { display: "2026/2027", period_key: "2026-2027" };
  }
}

/** Admin: semua baris program unggulan termasuk nonaktif. */
export async function getFeaturedProgramsAdmin() {
  try {
    const { rows } = await query(
      `SELECT id, title, description, sort_order, is_active, created_at
       FROM featured_programs
       ORDER BY sort_order ASC`,
      []
    );
    return rows ?? [];
  } catch (err) {
    if (!err.message?.includes("featured_programs")) {
      console.error("getFeaturedProgramsAdmin:", err.message);
    }
    return [];
  }
}

/** Admin: semua posts untuk management panel */
export async function getAllAdminPosts() {
  try {
    const { rows } = await query(
      `SELECT p.id, p.title, p.slug, p.category, p.status, p.created_at, p.created_at as published_at, p.author_id,
        json_build_object('display_name', a.display_name) AS accounts
       FROM posts p
       LEFT JOIN accounts a ON p.author_id = a.id
       ORDER BY p.created_at DESC`,
      []
    );
    return rows ?? [];
  } catch (err) {
    console.error("getAllAdminPosts:", err.message);
    return [];
  }
}

/** Admin: fetch single post with media for editing */
export async function getPostForEdit(postId) {
  try {
    const { rows } = await query(
      `SELECT p.id, p.title, p.excerpt as description, p.content, p.slug, p.category, p.status,
        p.created_at as published_at, p.author_id, p.event_date, p.event_location, p.featured_image_url as cover_image_url,
        (SELECT COALESCE(json_agg(json_build_object('id', pm.id, 'media_type', pm.media_type, 'url', pm.media_url, 'order_index', pm.sort_order)), '[]'::json)
         FROM post_media pm WHERE pm.post_id = p.id) AS post_media
       FROM posts p
       WHERE p.id = $1`,
      [postId]
    );
    const data = rows[0] ?? null;
    if (!data) return null;

    if (data.post_media) {
      data.post_media = data.post_media.sort(
        (a, b) => a.order_index - b.order_index,
      );
    }

    return data;
  } catch (err) {
    console.error("getPostForEdit:", err.message);
    return null;
  }
}

export async function getPermissionMatrix() {
  try {
    const [keysResult, matrixResult] = await Promise.all([
      query(
        `SELECT key, label, module FROM permission_keys ORDER BY module ASC`,
        []
      ),
      query(
        `SELECT role, permission_key, allowed FROM role_permissions`,
        []
      ),
    ]);

    return {
      keys: keysResult.rows ?? [],
      matrix: matrixResult.rows ?? [],
    };
  } catch {
    return { keys: [], matrix: [] };
  }
}
