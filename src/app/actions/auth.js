"use server";

import { query } from "@/lib/db";
import {
  clearSessionCookie,
  createSessionCookie,
  getSession as readFreshSession,
} from "@/lib/auth-session";
import { sendWelcomeEmail, sendStaffNewRegistrationNotification, sendNewDeviceLoginEmail } from "@/lib/email";
import { getStaffEmails } from "@/lib/queries";
import { isRegistrationEnabled } from "@/lib/cms";
import { getClientIp } from "@/lib/request-ip";
import {
  peekLoginFailures,
  recordLoginFailure,
  rateLimitMessage,
  peekRegisterOtpIp,
  peekRegisterOtpEmail,
  consumeRegisterOtpIp,
  consumeRegisterOtpEmail,
  consumeRegisterVerifyIp,
} from "@/lib/rate-limit";
import {
  checkTrustedIp,
  recordLoginSession,
  trustDevice,
  createNewIpAlert,
  markAlertEmailSent,
} from "@/lib/device-verify";
import { parseUserAgent } from "@/lib/device-utils";
import bcryptjs from "bcryptjs";
import crypto from "crypto";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

function hashOtp(otp) {
  return crypto.createHash("sha256").update(otp).digest("hex");
}

function validatePassword(password) {
  if (password.length < 8) return "Password minimal 8 karakter.";
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return "Password wajib berisi huruf dan angka.";
  }
  return null;
}

export async function getSession() {
  return readFreshSession();
}

export async function loginAction(prevState, formData) {
  const input =
    formData.get("username")?.toString().trim().toLowerCase() ?? "";
  const password = formData.get("password")?.toString() ?? "";
  const nextPath = formData.get("next")?.toString() ?? "";

  if (!input || !password) {
    return { error: "Username/email dan password wajib diisi." };
  }

  const ip = await getClientIp();
  const loginGate = peekLoginFailures(ip);
  if (!loginGate.ok) {
    return { error: rateLimitMessage(loginGate.retryAfterMs) };
  }

  const looksLikeEmail = input.includes("@");

  let account;
  try {
    const primaryCol = looksLikeEmail ? "email" : "username";
    const result = await query(
      `SELECT id, display_name, username, email, password_hash, role, is_active, banned FROM accounts WHERE ${primaryCol} = $1`,
      [input]
    );
    account = result.rows[0] ?? null;

    // Allow either identifier if user mixed them up
    if (!account) {
      const fallbackCol = looksLikeEmail ? "username" : "email";
      const fallback = await query(
        `SELECT id, display_name, username, email, password_hash, role, is_active, banned FROM accounts WHERE ${fallbackCol} = $1`,
        [input]
      );
      account = fallback.rows[0] ?? null;
    }
  } catch (err) {
    return { error: "Username/email atau password salah." };
  }

  if (!account || !account.is_active) {
    recordLoginFailure(ip);
    return { error: "Username/email atau password salah." };
  }

  if (account.banned) {
    recordLoginFailure(ip);
    return {
      error:
        "Akun ini diblokir oleh admin. Hubungi pembina atau humas apabila menurutmu ini kesalahan.",
    };
  }

  const valid = await bcryptjs.compare(password, account.password_hash);
  if (!valid) {
    recordLoginFailure(ip);
    return { error: "Username/email atau password salah." };
  }

  // Get user agent for device fingerprinting
  const headersList = await headers();
  const userAgent = headersList.get("user-agent") || "Unknown";
  const deviceName = parseUserAgent(userAgent);

  // Check if IP is trusted
  const { trusted } = await checkTrustedIp(account.id, ip);

  // Record login session
  await recordLoginSession(account.id, ip, userAgent, trusted);

  // If not trusted, send notification email
  if (!trusted) {
    const alert = await createNewIpAlert(account.id, ip);
    if (alert) {
      try {
        await sendNewDeviceLoginEmail(account.email, account.display_name, deviceName, ip);
        await markAlertEmailSent(alert.id);
      } catch (e) {
        console.error("Error sending new device email:", e);
      }
    }
  }

  await createSessionCookie(account);
  const safeNext =
    nextPath.startsWith("/") && !nextPath.startsWith("//") ? nextPath : (account.role === "admin" ? "/admin" : "/verify");
  redirect(safeNext);
}

export async function sendVerificationAction(prevState, formData) {
  const registrationEnabled = await isRegistrationEnabled();
  if (!registrationEnabled) {
    return { error: "Pendaftaran akun sedang ditutup oleh admin." };
  }

  const display_name = formData.get("display_name")?.toString().trim() ?? "";
  const username =
    formData.get("username")?.toString().trim().toLowerCase() ?? "";
  const email = formData.get("email")?.toString().trim().toLowerCase() ?? "";
  const password = formData.get("password")?.toString() ?? "";
  const konfirmasi = formData.get("konfirmasi")?.toString() ?? "";

  if (!display_name || !username || !email || !password || !konfirmasi) {
    return { error: "Semua field wajib diisi." };
  }
  if (username.length < 3) return { error: "Username minimal 3 karakter." };
  if (!/^[a-z0-9_]+$/.test(username)) {
    return {
      error: "Username hanya boleh huruf kecil, angka, dan underscore (_).",
    };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Format email tidak valid." };
  }
  const passwordError = validatePassword(password);
  if (passwordError) return { error: passwordError };
  if (password !== konfirmasi) {
    return { error: "Password dan konfirmasi tidak cocok." };
  }

  let existingUserResult;
  try {
    existingUserResult = await query(
      "SELECT id FROM accounts WHERE username = $1",
      [username]
    );
  } catch {
    existingUserResult = { rows: [] };
  }
  if (existingUserResult.rows[0]) {
    return { error: "Username sudah dipakai. Pilih username lain." };
  }

  let existingEmailResult;
  try {
    existingEmailResult = await query(
      "SELECT id FROM accounts WHERE email = $1",
      [email]
    );
  } catch {
    existingEmailResult = { rows: [] };
  }
  if (existingEmailResult.rows[0]) {
    return { error: "Email sudah terdaftar. Gunakan email lain atau login." };
  }

  const ip = await getClientIp();
  const rgIp = peekRegisterOtpIp(ip);
  const rgEm = peekRegisterOtpEmail(email);
  if (!rgIp.ok) return { error: rateLimitMessage(rgIp.retryAfterMs) };
  if (!rgEm.ok) return { error: rateLimitMessage(rgEm.retryAfterMs) };

  try {
    await query(
      "DELETE FROM otp_tokens WHERE email = $1 AND type = $2 AND used_at IS NULL",
      [email, "email_verify"]
    );
  } catch {
    // non-critical cleanup
  }

  const otp = String(crypto.randomInt(100000, 999999));
  const expires_at = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  try {
    await query(
      "INSERT INTO otp_tokens (email, account_id, token_hash, expires_at, type) VALUES ($1, $2, $3, $4, $5)",
      [email, null, hashOtp(otp), expires_at, "email_verify"]
    );
  } catch (err) {
    return { error: "Gagal membuat kode verifikasi." };
  }

  try {
    const { sendOtpEmail } = await import("@/lib/email");
    await sendOtpEmail(email, otp, display_name);
  } catch (error) {
    const message = String(error?.message || error || "Gagal mengirim email.");
    console.error("sendVerificationAction email error:", message);
    if (message.includes("domain is not verified")) {
      return {
        error:
          "Gagal mengirim email. Domain pengirim belum diverifikasi di Resend. Periksa EMAIL_FROM dan status domain di dashboard Resend.",
      };
    }
    return { error: "Gagal mengirim email. Cek kembali alamat email kamu." };
  }

  consumeRegisterOtpIp(ip);
  consumeRegisterOtpEmail(email);

  return { success: true, email };
}

export async function verifyAndRegisterAction(prevState, formData) {
  const registrationEnabled = await isRegistrationEnabled();
  if (!registrationEnabled) {
    return { error: "Pendaftaran akun sedang ditutup oleh admin." };
  }

  const display_name = formData.get("display_name")?.toString().trim() ?? "";
  const username =
    formData.get("username")?.toString().trim().toLowerCase() ?? "";
  const email = formData.get("email")?.toString().trim().toLowerCase() ?? "";
  const password = formData.get("password")?.toString() ?? "";
  const otp = formData.get("otp")?.toString().trim() ?? "";

  if (!display_name || !username || !email || !password || !otp) {
    return { error: "Data pendaftaran belum lengkap." };
  }
  if (otp.length !== 6 || !/^\d+$/.test(otp)) {
    return { error: "Kode OTP harus 6 digit angka." };
  }
  const passwordError = validatePassword(password);
  if (passwordError) return { error: passwordError };

  const ip = await getClientIp();
  const rv = consumeRegisterVerifyIp(ip);
  if (!rv.ok) return { error: rateLimitMessage(rv.retryAfterMs) };

  let token;
  try {
    const tokenResult = await query(
      "SELECT id, expires_at, used_at FROM otp_tokens WHERE email = $1 AND token_hash = $2 AND type = $3 AND used_at IS NULL",
      [email, hashOtp(otp), "email_verify"]
    );
    token = tokenResult.rows[0] ?? null;
  } catch {
    return { error: "Gagal memverifikasi kode OTP." };
  }

  if (!token) return { error: "Kode OTP salah atau tidak ditemukan." };
  if (new Date(token.expires_at) < new Date()) {
    return { error: "Kode OTP sudah kadaluarsa. Klik 'Kirim Ulang OTP'." };
  }

  let existingUserResult;
  try {
    existingUserResult = await query(
      "SELECT id FROM accounts WHERE username = $1",
      [username]
    );
  } catch {
    existingUserResult = { rows: [] };
  }
  if (existingUserResult.rows[0]) return { error: "Username sudah dipakai saat ini." };

  let existingEmailResult;
  try {
    existingEmailResult = await query(
      "SELECT id FROM accounts WHERE email = $1",
      [email]
    );
  } catch {
    existingEmailResult = { rows: [] };
  }
  if (existingEmailResult.rows[0]) return { error: "Email sudah terdaftar." };

  let newUser;
  try {
    await query(
      "UPDATE otp_tokens SET used_at = $1 WHERE id = $2",
      [new Date().toISOString(), token.id]
    );

    const password_hash = await bcryptjs.hash(password, 12);
    const insertResult = await query(
      "INSERT INTO accounts (display_name, username, email, password_hash, role, jabatan_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, display_name, username, role",
      [display_name, username, email, password_hash, "user", null]
    );
    newUser = insertResult.rows[0];
  } catch (err) {
    console.error(err);
    return { error: "Gagal membuat akun. Coba lagi." };
  }

  sendWelcomeEmail(email, display_name).catch(() => {});

  getStaffEmails()
    .then((staff) =>
      sendStaffNewRegistrationNotification(staff, {
        display_name,
        username,
        email,
      }),
    )
    .catch(() => {});

  await createSessionCookie(newUser);
  const nextPath = formData.get("next")?.toString() ?? "";
  const safeNext =
    nextPath.startsWith("/") && !nextPath.startsWith("//") ? nextPath : (account.role === "admin" ? "/admin" : "/verify");
  redirect(safeNext);
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/login");
}

export async function updateProfileAction(prevState, formData) {
  const session = await getSession();
  if (!session) return { error: "Sesi tidak valid. Silakan login ulang." };

  const display_name = formData.get("display_name")?.toString().trim() ?? "";

  if (!display_name) return { error: "Nama tidak boleh kosong." };
  if (display_name.length > 80) return { error: "Nama terlalu panjang." };

  try {
    await query(
      "UPDATE accounts SET display_name = $1 WHERE id = $2",
      [display_name, session.id]
    );
  } catch (err) {
    return { error: "Gagal memperbarui profil." };
  }
  return { success: "Profil berhasil diperbarui!" };
}

