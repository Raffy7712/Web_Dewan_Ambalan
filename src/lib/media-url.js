/**
 * Normalizes image URLs for <img src>. Google Drive share links must use
 * uc?export=view so the file renders inline.
 */
export function getGoogleDriveFileId(url) {
  if (!url) return null;
  const s = String(url).trim();
  let id =
    (s.match(/\/file\/d\/([^/?&]+)/) || s.match(/\/d\/([^/?&]+)/))?.[1] ??
    null;
  if (!id) {
    const q = s.match(/[?&]id=([^&]+)/);
    id = q ? q[1] : null;
  }
  return id || null;
}

export function getDisplayUrl(url) {
  if (!url) return "";
  const s = String(url).trim();
  if (!s.includes("drive.google.com")) return s;
  const id = getGoogleDriveFileId(s);
  return id ? `https://drive.google.com/uc?export=view&id=${id}` : s;
}

/** iframe src for Google Drive video files (share links often fail in a video element). */
export function getDriveVideoEmbedUrl(url) {
  const id = getGoogleDriveFileId(url);
  return id ? `https://drive.google.com/file/d/${id}/preview` : "";
}

export function isGoogleDriveUrl(url) {
  return String(url ?? "").includes("drive.google.com");
}

export function parseMediaUrlLines(raw) {
  if (raw == null || typeof raw !== "string") return [];
  return raw
    .split(/[\n\r]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}
