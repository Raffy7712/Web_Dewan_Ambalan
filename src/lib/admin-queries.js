import { createAdminClient } from "./supabase";

export async function getAllActiveAccountsForAdmin() {
  const db = createAdminClient();
  const { data, error } = await db
    .from("accounts")
    .select(
      `id, display_name, username, role, jabatan_id, is_active, banned,
       jabatan:jabatan(id, nama, urutan)`,
    )
    .eq("is_active", true)
    .eq("banned", false)
    .order("display_name", { ascending: true });

  if (error) {
    console.error("getAllActiveAccountsForAdmin:", error.message);
    return [];
  }

  return data ?? [];
}

/** Admin: daftar akun untuk kelola ban (tanpa password). */
export async function getAccountsForAdminList() {
  const db = createAdminClient();
  const { data, error } = await db
    .from("accounts")
    .select(
      "id, display_name, username, email, role, is_active, banned, banned_at, banned_reason, created_at",
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getAccountsForAdminList:", error.message);
    return [];
  }
  return data ?? [];
}

/**
 * Ringkasan traffic dari page_view_logs (butuh migration-v7).
 * @returns {Promise<{ ok: boolean, error?: string, totals?: object, byDay?: object[], topPaths?: {path:string,count:number}[] }>}
 */
export async function getPageViewAnalytics() {
  const db = createAdminClient();
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const since7d = new Date(now - 7 * dayMs).toISOString();
  const since24h = new Date(now - dayMs).toISOString();

  const { data, error } = await db
    .from("page_view_logs")
    .select("path, created_at")
    .gte("created_at", since7d)
    .limit(20000);

  if (error) {
    if (error.code === "42P01" || error.message?.includes("page_view_logs")) {
      return {
        ok: false,
        error:
          "Tabel page_view_logs belum ada. Jalankan migration-v7.sql di Supabase.",
      };
    }
    return { ok: false, error: error.message };
  }

  const rows = data ?? [];
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
  const db = createAdminClient();
  const { data, error } = await db
    .from("ambalan_applications")
    .select(
      "id, full_name, class_name, phone, motivation, experience, status, period, created_at, reviewed_at",
    )
    .eq("account_id", accountId)
    .eq("period", period)
    .maybeSingle();

  if (error) {
    if (error.code !== "42P01") {
      console.error("getMyAmbalanApplication:", error.message);
    }
    return null;
  }

  return data;
}

export async function getRegistrationSetting() {
  const db = createAdminClient();
  const { data } = await db
    .from("site_settings")
    .select("value_json")
    .eq("key", "registration_enabled")
    .maybeSingle();

  return data?.value_json?.enabled !== false;
}

export async function getAmbalanRegistrationSetting() {
  const db = createAdminClient();
  const { data } = await db
    .from("site_settings")
    .select("value_json")
    .eq("key", "ambalan_registration_enabled")
    .maybeSingle();

  return data?.value_json?.enabled !== false;
}

export async function getMasaBaktiSetting() {
  const db = createAdminClient();
  const { data } = await db
    .from("site_settings")
    .select("value_json")
    .eq("key", "masa_bakti")
    .maybeSingle();

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
}

/** Admin: semua baris program unggulan termasuk nonaktif. */
export async function getFeaturedProgramsAdmin() {
  const db = createAdminClient();
  const { data, error } = await db
    .from("featured_programs")
    .select("id, title, description, sort_order, is_active, created_at")
    .order("sort_order", { ascending: true });

  if (error) {
    if (error.code !== "42P01") {
      console.error("getFeaturedProgramsAdmin:", error.message);
    }
    return [];
  }

  return data ?? [];
}

/** Admin: semua posts untuk management panel */
export async function getAllAdminPosts() {
  const db = createAdminClient();

  const { data, error } = await db
    .from("posts")
    .select("id, title, slug, category, status, published_at, created_at, author_id, accounts(display_name)")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getAllAdminPosts:", error.message);
    return [];
  }

  return data ?? [];
}

/** Admin: fetch single post with media for editing */
export async function getPostForEdit(postId) {
  const db = createAdminClient();

  const { data, error } = await db
    .from("posts")
    .select(
      `id, title, description, content, slug, category, status,
       published_at, author_id, post_number, event_date, event_location,
       cover_image_url, post_media(id, media_type, url, order_index)`,
    )
    .eq("id", postId)
    .single();

  if (error) {
    console.error("getPostForEdit:", error.message);
    return null;
  }

  if (data && data.post_media) {
    data.post_media = data.post_media.sort(
      (a, b) => a.order_index - b.order_index,
    );
  }

  return data;
}

export async function getPermissionMatrix() {
  const db = createAdminClient();
  const [{ data: keys }, { data: matrix }] = await Promise.all([
    db.from("permission_keys").select("key, label, module").order("module", { ascending: true }),
    db.from("role_permissions").select("role, permission_key, allowed"),
  ]);

  return {
    keys: keys ?? [],
    matrix: matrix ?? [],
  };
}
