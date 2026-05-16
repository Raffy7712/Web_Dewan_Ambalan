/**
 * Supabase Storage helpers for Dewan Ambalan
 *
 * Buckets yang perlu dibuat di Supabase Dashboard → Storage:
 *   • avatars   — profile pictures (public)
 *   • post-media — foto & video postingan (public)
 *
 * Cara setup:
 *   1. Buka Supabase Dashboard → Storage → New bucket
 *   2. Buat bucket "avatars" dengan Public access ON
 *   3. Buat bucket "post-media" dengan Public access ON
 *   4. Upload dari sini atau lewat Dashboard langsung
 */

import { supabase, createAdminClient } from "./supabase";

// ─── Bucket names ────────────────────────────────────────────────────────────
export const BUCKET_AVATARS = "avatars";
export const BUCKET_MEDIA = "post-media";

// ─── Upload helpers ───────────────────────────────────────────────────────────

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];

const ALLOWED_MEDIA_TYPES = [
  ...ALLOWED_IMAGE_TYPES,
  "video/mp4",
  "video/webm",
  "video/quicktime",
];

const MAX_AVATAR_SIZE = 2 * 1024 * 1024; // 2 MB
const MAX_MEDIA_SIZE = 25 * 1024 * 1024; // 25 MB


/**
 * Upload profile picture.
 * @param {File} file - File object from <input type="file">
 * @param {string} userId - account.id (UUID)
 * @returns {{ url: string } | { error: string }}
 */
export async function uploadAvatar(file, userId) {
  // Validate file type
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return { error: "Format file tidak didukung. Gunakan JPG, PNG, GIF, atau WebP." };
  }
  // Validate file size
  if (file.size > MAX_AVATAR_SIZE) {
    return { error: "Ukuran file terlalu besar. Maksimal 2 MB." };
  }

  const ext = file.name.split(".").pop()?.replace(/[^\w.-]/g, "") || "jpg";
  const path = `${userId}/avatar.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET_AVATARS)
    .upload(path, file, { upsert: true, contentType: file.type });

  if (error) return { error: error.message };

  const { data } = supabase.storage.from(BUCKET_AVATARS).getPublicUrl(path);
  return { url: data.publicUrl };
}

/**
 * Upload post media (image or video).
 * @param {File} file - File object
 * @param {string} postId - posts.id (UUID)
 * @param {number} index - order index (0-based)
 * @returns {{ url: string, mediaType: string } | { error: string }}
 */
export async function uploadPostMedia(file, postId, index = 0) {
  // Validate file type
  if (!ALLOWED_MEDIA_TYPES.includes(file.type)) {
    return { error: "Format file tidak didukung. Gunakan JPG, PNG, GIF, WebP, MP4, WebM, atau MOV." };
  }
  // Validate file size
  if (file.size > MAX_MEDIA_SIZE) {
    return { error: "Ukuran file terlalu besar. Maksimal 25 MB." };
  }

  const ext = file.name.split(".").pop()?.replace(/[^\w.-]/g, "") || "bin";
  const mediaType = file.type.startsWith("video/") ? "video" : "image";
  const path = `${postId}/${index}-${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET_MEDIA)
    .upload(path, file, { upsert: false, contentType: file.type });

  if (error) return { error: error.message };

  const { data } = supabase.storage.from(BUCKET_MEDIA).getPublicUrl(path);
  return { url: data.publicUrl, mediaType };
}

/**
 * Upload post media dari Server Action (service role).
 */
export async function uploadPostMediaServer(file, postId, index = 0) {
  // Validate file type
  if (!ALLOWED_MEDIA_TYPES.includes(file.type)) {
    return { error: "Format file tidak didukung. Gunakan JPG, PNG, GIF, WebP, MP4, WebM, atau MOV." };
  }
  // Validate file size
  if (file.size > MAX_MEDIA_SIZE) {
    return { error: "Ukuran file terlalu besar. Maksimal 25 MB." };
  }

  const admin = createAdminClient();
  const ext = file.name.split(".").pop()?.replace(/[^\w.-]/g, "") || "bin";
  const mediaType = file.type.startsWith("video/") ? "video" : "image";
  const path = `${postId}/${index}-${Date.now()}.${ext}`;
  const buf = Buffer.from(await file.arrayBuffer());

  const { error } = await admin.storage
    .from(BUCKET_MEDIA)
    .upload(path, buf, {
      upsert: false,
      contentType: file.type || "application/octet-stream",
    });

  if (error) return { error: error.message };

  const { data } = admin.storage.from(BUCKET_MEDIA).getPublicUrl(path);
  return { url: data.publicUrl, mediaType };
}

/**
 * Delete a file from storage by its public URL.
 * @param {string} bucket - BUCKET_AVATARS or BUCKET_MEDIA
 * @param {string} publicUrl - the full public URL of the file
 */
export async function deleteByUrl(bucket, publicUrl) {
  // Extract path from URL: .../storage/v1/object/public/<bucket>/<path>
  const marker = `/object/public/${bucket}/`;
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return { error: "Invalid URL" };
  const path = publicUrl.slice(idx + marker.length);

  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) return { error: error.message };
  return { ok: true };
}

// ─── URL helpers ─────────────────────────────────────────────────────────────

/** Get public URL for any storage path */
export function getPublicUrl(bucket, path) {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
