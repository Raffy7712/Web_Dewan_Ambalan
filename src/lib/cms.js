import { query } from "./db";

const REGISTRATION_KEY = "registration_enabled";
const AMBALAN_REGISTRATION_KEY = "ambalan_registration_enabled";
const MASA_BAKTI_KEY = "masa_bakti";

export async function isRegistrationEnabled() {
  try {
    const { rows } = await query(
      `SELECT value_json FROM site_settings WHERE key = $1`,
      [REGISTRATION_KEY]
    );
    const data = rows[0] ?? null;
    return data?.value_json?.enabled !== false;
  } catch {
    return true;
  }
}

/** Toggle pendaftaran form seleksi calon pengurus (halaman /daftar-calon-dewan-ambalan). */
export async function isAmbalanRegistrationEnabled() {
  try {
    const { rows } = await query(
      `SELECT value_json FROM site_settings WHERE key = $1`,
      [AMBALAN_REGISTRATION_KEY]
    );
    const data = rows[0] ?? null;
    return data?.value_json?.enabled !== false;
  } catch {
    return false;
  }
}

/** Label masa bakti tampil + key penyimpanan periode aplikasi (unique di DB). */
export async function getMasaBakti() {
  try {
    const { rows } = await query(
      `SELECT value_json FROM site_settings WHERE key = $1`,
      [MASA_BAKTI_KEY]
    );
    const data = rows[0] ?? null;
    const j = data?.value_json ?? {};
    const display =
      typeof j.display === "string" && j.display.length > 0
        ? j.display
        : "2026/2027";
    const period_key =
      typeof j.period_key === "string" && j.period_key.length > 0
        ? j.period_key
        : "2026-2027";
    return { display, period_key };
  } catch {
    return { display: "2026/2027", period_key: "2026-2027" };
  }
}

export async function getCmsEntry(pageKey, sectionKey, entryKey) {
  try {
    const { rows } = await query(
      `SELECT id, payload, is_published
       FROM cms_entries
       WHERE page_key = $1 AND section_key = $2 AND entry_key = $3 AND is_published = true`,
      [pageKey, sectionKey, entryKey]
    );
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

export async function getCmsText(pageKey, sectionKey, entryKey, fallback = "") {
  const entry = await getCmsEntry(pageKey, sectionKey, entryKey);
  const text = entry?.payload?.text;
  return typeof text === "string" && text.length > 0 ? text : fallback;
}

const _cmsBatchCache = new Map();

export async function getCmsTexts(entries) {
  const cacheKey = JSON.stringify(entries);
  if (_cmsBatchCache.has(cacheKey)) return _cmsBatchCache.get(cacheKey);

  try {
    const conditions = entries.map((_, i) =>
      `(page_key = $${i * 3 + 1} AND section_key = $${i * 3 + 2} AND entry_key = $${i * 3 + 3})`
    ).join(" OR ");
    const params = entries.flatMap(e => [e.pageKey, e.sectionKey, e.entryKey]);
    const sql = `SELECT page_key, section_key, entry_key, payload FROM cms_entries WHERE is_published = true AND (${conditions})`;
    const { rows } = await query(sql, params);

    const map = {};
    for (const r of rows) {
      map[`${r.page_key}|${r.section_key}|${r.entry_key}`] = r.payload?.text ?? "";
    }
    const result = entries.map(e => map[`${e.pageKey}|${e.sectionKey}|${e.entryKey}`] ?? null);
    _cmsBatchCache.set(cacheKey, result);
    return result;
  } catch {
    return entries.map(() => null);
  }
}

export async function getCmsEntriesByPage(pageKey) {
  try {
    const { rows } = await query(
      `SELECT id, page_key, section_key, entry_key, payload, is_published, sort_order, updated_at
       FROM cms_entries
       WHERE page_key = $1
       ORDER BY section_key ASC, sort_order ASC`,
      [pageKey]
    );
    return rows ?? [];
  } catch {
    return [];
  }
}
