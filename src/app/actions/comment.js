"use server";

import { createAdminClient } from "@/lib/supabase";
import { getSession } from "./auth";
import { detectProfanity } from "@/lib/profanity";
import { getStaffEmails } from "@/lib/queries";
import { sendNewCommentNotification } from "@/lib/email";

// ─── Spam Detection ───────────────────────────────────────────────────────────
// Tidak mendeteksi pengulangan karakter — itu ekspresi normal Indonesia
// (waaaaah, !!!!! adalah ungkapan emosi, bukan spam)

const SPAM_PATTERNS = [
  // Judi online — konteks Indonesia
  /\b(judi|slot\s*online|gacor|maxwin|togel|casino|poker|sbobet|betting|taruhan|scatter|rtp\s*live)\b/i,
  // Link shortener/redirect berbahaya
  /wa\.me\/\d+|bit\.ly\/|tinyurl\.com|cutt\.ly|s\.id\//i,
  // Spam medis/obat
  /\b(obat\s*(kuat|herbal|manjur)|pil\s*(biru|merah)|suplemen\s*(pria|wanita))\b/i,
  // Generic spam calls-to-action
  /\b(klik\s*disini|click\s*here|daftar\s*sekarang|join\s*now|hubungi\s*admin)\b/i,
  // Konten dewasa
  /\b(bokep|porno|bugil|telanjang|xxx)\b/i,
];

/**
 * Calculate spam score (>= 50 = spam, tanpa cek karakter berulang).
 */
function detectSpam(content) {
  let score = 0;
  const c = content.trim();

  // Terlalu pendek / tidak berarti
  if (c.length < 3) return { isSpam: true, score: 100 };

  // URL dalam komentar
  const urlCount = (c.match(/https?:\/\/\S+/g) ?? []).length;
  score += urlCount * 30;

  // Pattern spam
  for (const pattern of SPAM_PATTERNS) {
    if (pattern.test(c)) score += 45;
  }

  // Konten repetitif (> 70% kata sama) — tetap dipertahankan
  const words = c.toLowerCase().split(/\s+/);
  const uniqueWords = new Set(words);
  if (words.length > 6 && uniqueWords.size / words.length < 0.25) {
    score += 35;
  }

  // Huruf kapital berlebihan (> 70% dari huruf)
  const letters = c.replace(/[^a-zA-Z]/g, "");
  if (letters.length > 20) {
    const capRatio = (c.match(/[A-Z]/g) ?? []).length / letters.length;
    if (capRatio > 0.7) score += 20;
  }

  return { isSpam: score >= 50, score };
}

// ─── Rate Limiting ────────────────────────────────────────────────────────────

/** 5 komentar per 1 menit — lebih ketat dari sebelumnya */
async function isRateLimited(authorId, db) {
  const oneMinAgo = new Date(Date.now() - 60 * 1000).toISOString();
  const { count } = await db
    .from("comments")
    .select("id", { count: "exact", head: true })
    .eq("author_id", authorId)
    .gte("created_at", oneMinAgo);

  return (count ?? 0) >= 5;
}

// ─── Server Action ────────────────────────────────────────────────────────────

export async function submitCommentAction(prevState, formData) {
  const session = await getSession();
  if (!session) {
    return { error: "Kamu harus login untuk berkomentar." };
  }

  const post_id = formData.get("post_id")?.toString() ?? "";
  const parent_id = formData.get("parent_id")?.toString() || null;
  const content = formData.get("content")?.toString().trim() ?? "";
  const postTitle = formData.get("post_title")?.toString() ?? "";
  const postSlug = formData.get("post_slug")?.toString() ?? "";

  if (!post_id) return { error: "Post tidak valid." };
  if (content.length < 3)
    return { error: "Komentar terlalu pendek (min. 3 karakter)." };
  if (content.length > 1000)
    return { error: "Komentar terlalu panjang (maks. 1000 karakter)." };

  const db = createAdminClient();

  // ── Rate limiting ──
  const limited = await isRateLimited(session.id, db);
  if (limited) {
    return {
      error: "Kamu mengirim terlalu banyak komentar. Tunggu 1 menit.",
    };
  }

  // ── Profanity check ──
  const profanity = detectProfanity(content);
  if (profanity.found) {
    return {
      error:
        "Komentar mengandung kata yang tidak pantas. Tolong gunakan bahasa yang sopan.",
    };
  }

  // ── Spam detection ──
  const { isSpam, score } = detectSpam(content);

  const { error } = await db.from("comments").insert({
    post_id,
    author_id: session.id,
    parent_id,
    content,
    is_spam: isSpam,
    spam_score: score,
    is_pinned: false,
  });

  if (error) {
    console.error("submitCommentAction:", error.message);
    return { error: "Gagal mengirim komentar. Coba lagi." };
  }

  // ── Notifikasi ke staff (non-blocking, async) ──
  if (!isSpam && postTitle && postSlug) {
    getStaffEmails()
      .then((staff) =>
        sendNewCommentNotification(staff, {
          postTitle,
          postSlug,
          authorName: session.display_name ?? session.username,
          content,
        }),
      )
      .catch(() => {}); // silently ignore notification errors
  }

  if (isSpam) {
    // Jangan beri tahu user kalau terdeteksi spam
    return { success: "Komentar terkirim." };
  }

  return { success: "Komentar berhasil diterbitkan!" };
}
