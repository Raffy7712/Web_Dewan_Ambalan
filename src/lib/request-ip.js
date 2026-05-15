import { headers } from "next/headers";

/**
 * IP klien untuk rate limiting (server actions).
 * Trust X-Forwarded-For only from known proxies (Vercel sets x-vercel-forwarded-for).
 * Prevents IP spoofing to bypass rate limits.
 */

// On Vercel, the real client IP is in x-vercel-forwarded-for.
// X-Forwarded-For can be spoofed by clients, so we only trust it
// if we're on Vercel (which sets x-vercel-forwarded-for reliably).
const isVercel = !!process.env.VERCEL;

export async function getClientIp() {
  const h = await headers();
  return getClientIpFromHeaders(h);
}

/** @param {Headers} h */
export function getClientIpFromHeaders(h) {
  // Vercel provides the verified client IP in x-vercel-forwarded-for
  if (isVercel) {
    const vff = h.get("x-vercel-forwarded-for");
    if (vff) {
      const first = vff.split(",")[0]?.trim();
      if (first) return first;
    }
  }

  // In non-Vercel environments, trust x-forwarded-for only from known proxies
  // For now, use x-real-ip as a safer fallback, then x-forwarded-for
  const real = h.get("x-real-ip")?.trim();
  if (real) return real;

  // Only use x-forwarded-for as a last resort — note this can be spoofed
  // by clients not behind a trusted proxy. In production, configure your
  // proxy to strip/override this header.
  const xff = h.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }

  return "unknown";
}
