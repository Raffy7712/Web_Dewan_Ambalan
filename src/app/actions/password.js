"use server";

import { createAdminClient } from "@/lib/supabase";
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

  const db = createAdminClient();

  // Find account by email
  const { data: account } = await db
    .from("accounts")
    .select("id, display_name, email, is_active")
    .eq("email", email)
    .maybeSingle();

  // Always show success to prevent email enumeration attacks
  if (!account || !account.is_active) {
    return {
      success: true,
      message: "Jika email terdaftar, kode OTP sudah dikirim. Cek inbox/spam kamu.",
    };
  }

  // Invalidate old unused tokens for this email
  await db
    .from("otp_tokens")
    .delete()
    .eq("email", email)
    .eq("type", "password_reset")
    .is("used_at", null);

  const otp = generateOTP();
  const token_hash = hashOTP(otp);
  const expires_at = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000).toISOString();

  const { error: insertErr } = await db.from("otp_tokens").insert({
    account_id: account.id,
    email,
    token_hash,
    expires_at,
    type: "password_reset",
  });

  if (insertErr) {
    console.error("OTP insert error:", insertErr.message);
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

  const db = createAdminClient();
  const token_hash = hashOTP(otp);

  // Find valid, unused token
  const { data: token } = await db
    .from("otp_tokens")
    .select("id, account_id, expires_at, used_at")
    .eq("email", email)
    .eq("token_hash", token_hash)
    .eq("type", "password_reset")
    .is("used_at", null)
    .maybeSingle();

  if (!token) {
    return { error: "Kode OTP salah atau tidak ditemukan." };
  }

  if (new Date(token.expires_at) < new Date()) {
    return { error: "Kode OTP sudah kadaluarsa. Minta kode baru." };
  }

  // Mark token as used
  await db
    .from("otp_tokens")
    .update({ used_at: new Date().toISOString() })
    .eq("id", token.id);

  // Update password
  const password_hash = await bcryptjs.hash(password, 12);
  const { error: updateErr } = await db
    .from("accounts")
    .update({ password_hash })
    .eq("id", token.account_id);

  if (updateErr) {
    return { error: "Gagal memperbarui password. Coba lagi." };
  }

  const { data: acc } = await db
    .from("accounts")
    .select("email, display_name")
    .eq("id", token.account_id)
    .maybeSingle();
  if (acc?.email) {
    sendPasswordChangedEmail(acc.email, acc.display_name ?? "Pengguna").catch(
      () => {},
    );
  }

  redirect("/login?reset=success");
}
