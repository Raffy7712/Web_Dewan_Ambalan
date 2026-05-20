import { headers } from "next/headers";

/**
 * IP klien untuk rate limiting (server actions).
 * Di balik proxy/load balancer gunakan X-Forwarded-For / X-Real-IP.
 */
export async function getClientIp() {
  const h = await headers();
  return getClientIpFromHeaders(h);
}

/** @param {Headers} h */
export function getClientIpFromHeaders(h) {
  const xff = h.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = h.get("x-real-ip")?.trim();
  if (real) return real;
  return "unknown";
}
