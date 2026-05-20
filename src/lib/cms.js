import { query } from "./db";

const REGISTRATION_KEY = "registration_enabled";
const AMBALAN_REGISTRATION_KEY = "ambalan_registration_enabled";
const MASA_BAKTI_KEY = "masa_bakti";

export async function isRegistrationEnabled() {
  const { rows } = await query(
    `SELECT value_json FROM site_settings WHERE key = $1`,
    [REGISTRATION_KEY]
  );
  const data = rows[0] ?? null;
  return data?.value_json?.enabled !== false;
}

/** Toggle pendaftaran form seleksi calon pengurus (halaman /daftar-ambalan). */
export async function isAmbalanRegistrationEnabled() {
  const { rows } = await query(
    `SELECT value_json FROM site_settings WHERE key = $1`,
    [AMBALAN_REGISTRATION_KEY]
  );
  const data = rows[0] ?? null;
  return data?.value_json?.enabled !== false;
}

/** Label masa bakti tampil + key penyimpanan periode aplikasi (unique di DB). */
export async function getMasaBakti() {
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
}

export async function getCmsEntry(pageKey, sectionKey, entryKey) {
  const { rows } = await query(
    `SELECT id, payload, is_published
     FROM cms_entries
     WHERE page_key = $1 AND section_key = $2 AND entry_key = $3 AND is_published = true`,
    [pageKey, sectionKey, entryKey]
  );
  return rows[0] ?? null;
}

export async function getCmsText(pageKey, sectionKey, entryKey, fallback = "") {
  const entry = await getCmsEntry(pageKey, sectionKey, entryKey);
  const text = entry?.payload?.text;
  return typeof text === "string" && text.length > 0 ? text : fallback;
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


