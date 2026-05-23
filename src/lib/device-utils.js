/**
 * device-utils.js — Pure utility functions for device detection
 * Extracted from device-verify.js to avoid sync function exports in "use server" chain
 */
import crypto from "crypto";

/**
 * Extract device name from User-Agent string
 * e.g., "Chrome on Windows", "Safari on macOS"
 */
export function parseUserAgent(userAgent) {
  if (!userAgent) return "Unknown Device";

  // Browser detection
  let browser = "Unknown";
  if (userAgent.includes("Chrome")) browser = "Chrome";
  else if (userAgent.includes("Firefox")) browser = "Firefox";
  else if (userAgent.includes("Safari")) browser = "Safari";
  else if (userAgent.includes("Edge")) browser = "Edge";
  else if (userAgent.includes("Opera")) browser = "Opera";

  // OS detection
  let os = "Unknown OS";
  if (userAgent.includes("Windows")) os = "Windows";
  else if (userAgent.includes("Mac")) os = "macOS";
  else if (userAgent.includes("Linux")) os = "Linux";
  else if (userAgent.includes("iPhone")) os = "iOS";
  else if (userAgent.includes("Android")) os = "Android";

  return `${browser} on ${os}`;
}

/**
 * Get hash of user agent for device fingerprinting
 */
export function hashUserAgent(userAgent) {
  if (!userAgent) return null;
  return crypto.createHash("sha256").update(userAgent).digest("hex");
}
