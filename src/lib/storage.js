/**
 * Storage helpers for Dewan Ambalan
 *
 * NOTE: This file previously used Supabase Storage for file uploads.
 * The app now uses Cloudinary for uploads, so all Supabase Storage
 * operations have been commented out. File storage needs to be
 * reconfigured to use Cloudinary (or another provider) instead.
 *
 * If you need to restore file upload functionality, implement
 * equivalent functions using the Cloudinary SDK or your preferred
 * storage provider.
 */

// ─── Bucket names (kept for reference) ──────────────────────────────────────
export const BUCKET_AVATARS = "avatars";
export const BUCKET_MEDIA = "post-media";

// ─── Upload helpers ───────────────────────────────────────────────────────────

/**
 * Upload profile picture.
 * TODO: Re-implement using Cloudinary or another storage provider.
 * @param {File} file - File object from <input type="file">
 * @param {string} userId - account.id (UUID)
 * @returns {{ url: string } | { error: string }}
 */
export async function uploadAvatar(file, userId) {
  // Previously used Supabase Storage:
  // const ext = file.name.split(".").pop();
  // const path = `${userId}/avatar.${ext}`;
  // const { error } = await supabase.storage.from(BUCKET_AVATARS).upload(path, file, { upsert: true, contentType: file.type });
  // if (error) return { error: error.message };
  // const { data } = supabase.storage.from(BUCKET_AVATARS).getPublicUrl(path);
  // return { url: data.publicUrl };

  console.warn("uploadAvatar: Supabase Storage removed — reconfigure with Cloudinary or another provider.");
  return { error: "File storage not configured. Re-implement with Cloudinary or another provider." };
}

/**
 * Upload post media (image or video).
 * TODO: Re-implement using Cloudinary or another storage provider.
 * @param {File} file - File object
 * @param {string} postId - posts.id (UUID)
 * @param {number} index - order index (0-based)
 * @returns {{ url: string, mediaType: string } | { error: string }}
 */
export async function uploadPostMedia(file, postId, index = 0) {
  // Previously used Supabase Storage:
  // const ext = file.name.split(".").pop();
  // const mediaType = file.type.startsWith("video/") ? "video" : "image";
  // const path = `${postId}/${index}-${Date.now()}.${ext}`;
  // const { error } = await supabase.storage.from(BUCKET_MEDIA).upload(path, file, { upsert: false, contentType: file.type });
  // if (error) return { error: error.message };
  // const { data } = supabase.storage.from(BUCKET_MEDIA).getPublicUrl(path);
  // return { url: data.publicUrl, mediaType };

  console.warn("uploadPostMedia: Supabase Storage removed — reconfigure with Cloudinary or another provider.");
  return { error: "File storage not configured. Re-implement with Cloudinary or another provider." };
}

/**
 * Upload post media dari Server Action (service role).
 * TODO: Re-implement using Cloudinary or another storage provider.
 */
export async function uploadPostMediaServer(file, postId, index = 0) {
  // Previously used Supabase Storage with admin client:
  // const ext = file.name.split(".").pop()?.replace(/[^\w.-]/g, "") || "bin";
  // const mediaType = file.type.startsWith("video/") ? "video" : "image";
  // const path = `${postId}/${index}-${Date.now()}.${ext}`;
  // const buf = Buffer.from(await file.arrayBuffer());
  // const { error } = await admin.storage.from(BUCKET_MEDIA).upload(path, buf, { ... });
  // if (error) return { error: error.message };
  // const { data } = admin.storage.from(BUCKET_MEDIA).getPublicUrl(path);
  // return { url: data.publicUrl, mediaType };

  console.warn("uploadPostMediaServer: Supabase Storage removed — reconfigure with Cloudinary or another provider.");
  return { error: "File storage not configured. Re-implement with Cloudinary or another provider." };
}

/**
 * Delete a file from storage by its public URL.
 * TODO: Re-implement using Cloudinary or another storage provider.
 * @param {string} bucket - BUCKET_AVATARS or BUCKET_MEDIA
 * @param {string} publicUrl - the full public URL of the file
 */
export async function deleteByUrl(bucket, publicUrl) {
  // Previously used Supabase Storage:
  // const marker = `/object/public/${bucket}/`;
  // const idx = publicUrl.indexOf(marker);
  // if (idx === -1) return { error: "Invalid URL" };
  // const path = publicUrl.slice(idx + marker.length);
  // const { error } = await supabase.storage.from(bucket).remove([path]);
  // if (error) return { error: error.message };
  // return { ok: true };

  console.warn("deleteByUrl: Supabase Storage removed — reconfigure with Cloudinary or another provider.");
  return { error: "File storage not configured. Re-implement with Cloudinary or another provider." };
}

// ─── URL helpers ─────────────────────────────────────────────────────────────

/** Get public URL for any storage path */
export function getPublicUrl(bucket, path) {
  // Previously used Supabase Storage:
  // const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  // return data.publicUrl;

  // Return a placeholder — must be reconfigured with Cloudinary or another provider.
  console.warn("getPublicUrl: Supabase Storage removed — reconfigure with Cloudinary or another provider.");
  return "";
}
