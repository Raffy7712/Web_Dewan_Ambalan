/**
 * Rate limit in-memory (sliding window per key).
 * Dev & single instance: cukup. Multi-replica: pakai Redis/KV agar limit global (lihat Kitab Suci).
 */

const buckets = new Map();
const BUCKET_CLEANUP_INTERVAL = 60 * 60 * 1000;
let lastCleanup = Date.now();

function cleanupStaleKeys() {
  const now = Date.now();
  if (now - lastCleanup < BUCKET_CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [key, entries] of buckets) {
    const fresh = entries.filter((t) => now - t < 3600000);
    if (fresh.length === 0) {
      buckets.delete(key);
    } else {
      buckets.set(key, fresh);
    }
  }
}

function getPrunedArray(key, windowMs) {
  cleanupStaleKeys();
  const now = Date.now();
  const arr = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  buckets.set(key, arr);
  return { arr, now };
}

/**
 * @returns {{ ok: boolean, retryAfterMs?: number }}
 */
export function rateLimitPeek(key, max, windowMs) {
  const { arr, now } = getPrunedArray(key, windowMs);
  if (arr.length >= max) {
    const oldest = arr[0];
    return { ok: false, retryAfterMs: Math.max(0, windowMs - (now - oldest)) };
  }
  return { ok: true };
}

/**
 * @returns {{ ok: boolean, retryAfterMs?: number }}
 */
export function rateLimitConsume(key, max, windowMs) {
  const { arr, now } = getPrunedArray(key, windowMs);
  if (arr.length >= max) {
    const oldest = arr[0];
    return { ok: false, retryAfterMs: Math.max(0, windowMs - (now - oldest)) };
  }
  arr.push(now);
  buckets.set(key, arr);
  return { ok: true };
}

export function rateLimitMessage(retryAfterMs) {
  const sec = Math.ceil((retryAfterMs ?? 60000) / 1000);
  if (sec >= 120) {
    const m = Math.ceil(sec / 60);
    return `Terlalu banyak permintaan. Coba lagi sekitar ${m} menit lagi.`;
  }
  return `Terlalu banyak permintaan. Coba lagi dalam ${sec} detik.`;
}

const LOGIN_WINDOW = 15 * 60 * 1000;
const LOGIN_MAX = 28;

export function peekLoginFailures(ip) {
  return rateLimitPeek(`login-fail:${ip}`, LOGIN_MAX, LOGIN_WINDOW);
}

export function recordLoginFailure(ip) {
  return rateLimitConsume(`login-fail:${ip}`, LOGIN_MAX, LOGIN_WINDOW);
}

const HOUR = 60 * 60 * 1000;

export function peekForgotPasswordIp(ip) {
  return rateLimitPeek(`fp-ip:${ip}`, 20, HOUR);
}

export function peekForgotPasswordEmail(email) {
  return rateLimitPeek(`fp-email:${email.toLowerCase()}`, 5, HOUR);
}

export function consumeForgotPasswordIp(ip) {
  return rateLimitConsume(`fp-ip:${ip}`, 20, HOUR);
}

export function consumeForgotPasswordEmail(email) {
  return rateLimitConsume(`fp-email:${email.toLowerCase()}`, 5, HOUR);
}

export function peekRegisterOtpIp(ip) {
  return rateLimitPeek(`reg-otp-ip:${ip}`, 25, HOUR);
}

export function peekRegisterOtpEmail(email) {
  return rateLimitPeek(`reg-otp-email:${email.toLowerCase()}`, 5, HOUR);
}

export function consumeRegisterOtpIp(ip) {
  return rateLimitConsume(`reg-otp-ip:${ip}`, 25, HOUR);
}

export function consumeRegisterOtpEmail(email) {
  return rateLimitConsume(`reg-otp-email:${email.toLowerCase()}`, 5, HOUR);
}

export function consumeRegisterVerifyIp(ip) {
  return rateLimitConsume(`reg-verify-ip:${ip}`, 45, HOUR);
}

export function consumeResetPasswordIp(ip) {
  return rateLimitConsume(`reset-pw-ip:${ip}`, 35, HOUR);
}

export function consumeAmbalanUser(userId) {
  return rateLimitConsume(`ambalan:${userId}`, 12, HOUR);
}

export function consumePageViewIp(ip) {
  return rateLimitConsume(`pv:${ip}`, 500, 60 * 1000);
}
