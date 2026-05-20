"use server";

import { query, getClient } from "@/lib/db";
import { sendOtpEmail, sendPasswordChangedEmail } from "@/lib/email";
import { getClientIp } from "@/lib/request-ip";
import {
  peekForgotPasswordIp,
  peekForgotPasswordEmail,
  consumeForgotPasswordIp,
  consumeForgotPasswordEmail,
  consumeResetPasswordIp,
  rateLimitMessage,
} from "@/lib/rate-limit";
import bcryptjs from "bcryptjs";
import crypto from "crypto";
import { redirect } from "next/navigation";

const OTP_EXPIRY_MINUTES = 15;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generateOTP() {
  // Cryptographically secure 6-digit OTP
  return String(crypto.randomInt(100000, 999999));
}

function hashOTP(otp) {
  return crypto.createHash("sha256").update(otp).digest("hex");
}

// ─── Step 1: Request OTP ─────────────────────────────────────────────────────

export async function requestOtpAction(prevState, formData) {
  const email = formData.get("email")?.toString().trim().toLowerCase() ?? "";

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Masukkan alamat email yang valid." };
  }

  const ip = await getClientIp();
  const pIp = peekForgotPasswordIp(ip);
  const pEm = peekForgotPasswordEmail(email);
  if (!pIp.ok) return { error: rateLimitMessage(pIp.retryAfterMs) };
  if (!pEm.ok) return { error: rateLimitMessage(pEm.retryAfterMs) };

  // Find account by email
  let account;
  try {
    const result = await query(
      "SELECT id, display_name, email, is_active FROM accounts WHERE email = $1",
      [email]
    );
    account = result.rows[0] ?? null;
  } catch (err) {
    // Silently ignore — prevent email enumeration
    account = null;
  }

  // Always show success to prevent email enumeration attacks
  if (!account || !account.is_active) {
    return {
      success: true,
      message: "Jika email terdaftar, kode OTP sudah dikirim. Cek inbox/spam kamu.",
    };
  }

  // Invalidate old unused tokens for this email
  try {
    await query(
      "DELETE FROM otp_tokens WHERE email = $1 AND type = $2 AND used_at IS NULL",
      [email, "password_reset"]
    );
  } catch (err) {
    // Non-critical, continue
  }

  const otp = generateOTP();
  const token_hash = hashOTP(otp);
  const expires_at = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000).toISOString();

  try {
    await query(
      "INSERT INTO otp_tokens (account_id, email, token_hash, expires_at, type) VALUES ($1, $2, $3, $4, $5)",
      [account.id, email, token_hash, expires_at, "password_reset"]
    );
  } catch (err) {
    console.error("OTP insert error:", err.message);
    return { error: "Gagal membuat kode OTP. Coba lagi." };
  }

  try {
    await sendOtpEmail(email, otp, account.display_name);
  } catch (e) {
    console.error("Email send error:", e.message);
    return { error: "Gagal mengirim email. Pastikan alamat email benar." };
  }

  consumeForgotPasswordIp(ip);
  consumeForgotPasswordEmail(email);

  return {
    success: true,
    email, // pass email to next step
    message: "Kode OTP sudah dikirim ke email kamu. Berlaku 15 menit.",
  };
}

// ─── Step 2: Verify OTP + Reset Password ─────────────────────────────────────

export async function resetPasswordAction(prevState, formData) {
  const email     = formData.get("email")?.toString().trim().toLowerCase() ?? "";
  const otp       = formData.get("otp")?.toString().trim() ?? "";
  const password  = formData.get("password")?.toString() ?? "";
  const konfirmasi = formData.get("konfirmasi")?.toString() ?? "";

  if (!email || !otp || !password || !konfirmasi) {
    return { error: "Semua field wajib diisi." };
  }
  if (otp.length !== 6 || !/^\d+$/.test(otp)) {
    return { error: "Kode OTP harus 6 digit angka." };
  }
  if (password.length < 8) {
    return { error: "Password baru minimal 8 karakter." };
  }
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return { error: "Password baru wajib berisi huruf dan angka." };
  }
  if (password !== konfirmasi) {
    return { error: "Password dan konfirmasi tidak cocok." };
  }

  const ip = await getClientIp();
  const rl = consumeResetPasswordIp(ip);
  if (!rl.ok) return { error: rateLimitMessage(rl.retryAfterMs) };

  const token_hash = hashOTP(otp);

  // Find valid, unused token
  let token;
  try {
    const tokenResult = await query(
      "SELECT id, account_id, expires_at, used_at FROM otp_tokens WHERE email = $1 AND token_hash = $2 AND type = $3 AND used_at IS NULL",
      [email, token_hash, "password_reset"]
    );
    token = tokenResult.rows[0] ?? null;
  } catch (err) {
    return { error: "Kode OTP salah atau tidak ditemukan." };
  }

  if (!token) {
    return { error: "Kode OTP salah atau tidak ditemukan." };
  }

  if (new Date(token.expires_at) < new Date()) {
    return { error: "Kode OTP sudah kadaluarsa. Minta kode baru." };
  }

  const client = await getClient();
  try {
    await client.query("BEGIN");

    // Mark token as used
    await client.query(
      "UPDATE otp_tokens SET used_at = $1 WHERE id = $2",
      [new Date().toISOString(), token.id]
    );

    // Update password
    const password_hash = await bcryptjs.hash(password, 12);
    await client.query(
      "UPDATE accounts SET password_hash = $1 WHERE id = $2",
      [password_hash, token.account_id]
    );

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    return { error: "Gagal memperbarui password. Coba lagi." };
  } finally {
    client.release();
  }

  let acc;
  try {
    const accResult = await query(
      "SELECT email, display_name FROM accounts WHERE id = $1",
      [token.account_id]
    );
    acc = accResult.rows[0] ?? null;
  } catch (err) {
    acc = null;
  }
  if (acc?.email) {
    sendPasswordChangedEmail(acc.email, acc.display_name ?? "Pengguna").catch(
      () => {},
    );
  }

  redirect("/login?reset=success");
}
