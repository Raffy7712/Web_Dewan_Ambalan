"use server";

import { query } from "@/lib/db";
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
async function isRateLimited(authorId) {
  const oneMinAgo = new Date(Date.now() - 60 * 1000).toISOString();
  try {
    const result = await query(
      "SELECT COUNT(*) as count FROM comments WHERE author_id = $1 AND created_at >= $2",
      [authorId, oneMinAgo]
    );
    return Number(result.rows[0].count) >= 5;
  } catch (err) {
    // On error, allow the comment (fail open)
    return false;
  }
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

  // ── Rate limiting ──
  const limited = await isRateLimited(session.id);
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

  try {
    await query(
      "INSERT INTO comments (post_id, author_id, parent_id, content, is_spam, spam_score, is_pinned) VALUES ($1, $2, $3, $4, $5, $6, $7)",
      [post_id, session.id, parent_id, content, isSpam, score, false]
    );
  } catch (err) {
    console.error("submitCommentAction:", err.message);
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
