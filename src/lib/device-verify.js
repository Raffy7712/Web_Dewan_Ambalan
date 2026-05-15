/**
 * Device & IP Verification Utilities
 * Handles tracking login devices, verifying trusted IPs, and notifying users of new logins
 */

import { createAdminClient } from "./supabase";

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
  const crypto = require("crypto");
  return crypto.createHash("sha256").update(userAgent).digest("hex");
}

/**
 * Check if IP is trusted for user
 * Returns { trusted: boolean, deviceName: string }
 */
export async function checkTrustedIp(userId, ipAddress) {
  const db = createAdminClient();

  const { data, error } = await db
    .from("trusted_devices")
    .select("device_name")
    .eq("user_id", userId)
    .eq("ip_address", ipAddress)
    .maybeSingle();

  if (error) {
    console.error("Error checking trusted IP:", error);
    return { trusted: false, deviceName: null };
  }

  return {
    trusted: !!data,
    deviceName: data?.device_name || null,
  };
}

/**
 * Record a login session
 */
export async function recordLoginSession(
  userId,
  ipAddress,
  userAgent,
  autoTrust = false
) {
  const db = createAdminClient();
  const deviceName = parseUserAgent(userAgent);
  const deviceFingerprint = hashUserAgent(userAgent);

  // Record the login session
  const { data: sessionData, error: sessionError } = await db
    .from("login_sessions")
    .insert({
      user_id: userId,
      ip_address: ipAddress,
      user_agent: userAgent,
      device_name: deviceName,
      is_verified: autoTrust,
      verified_at: autoTrust ? new Date().toISOString() : null,
    })
    .select("id")
    .single();

  if (sessionError) {
    console.error("Error recording login session:", sessionError);
    return null;
  }

  // Auto-trust if first login or if explicitly requested
  if (autoTrust) {
    await trustDevice(userId, ipAddress, deviceName, deviceFingerprint);
  }

  return sessionData;
}

/**
 * Mark a device as trusted
 */
export async function trustDevice(
  userId,
  ipAddress,
  deviceName,
  deviceFingerprint
) {
  const db = createAdminClient();

  const { data, error } = await db
    .from("trusted_devices")
    .upsert(
      {
        user_id: userId,
        ip_address: ipAddress,
        device_name: deviceName,
        device_fingerprint: deviceFingerprint,
        last_used: new Date().toISOString(),
      },
      {
        onConflict: "user_id,ip_address",
      }
    )
    .select("id");

  if (error) {
    console.error("Error trusting device:", error);
  }

  return data?.[0] || null;
}

/**
 * Get count of trusted devices for user
 */
export async function getTrustedDeviceCount(userId) {
  const db = createAdminClient();

  const { count, error } = await db
    .from("trusted_devices")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error) {
    console.error("Error getting trusted device count:", error);
    return 0;
  }

  return count || 0;
}

/**
 * Get user's login history
 */
export async function getLoginHistory(userId, limit = 10) {
  const db = createAdminClient();

  const { data, error } = await db
    .from("login_sessions")
    .select("id, ip_address, device_name, login_timestamp, is_verified")
    .eq("user_id", userId)
    .order("login_timestamp", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error getting login history:", error);
    return [];
  }

  return data || [];
}

/**
 * Get user's trusted devices
 */
export async function getTrustedDevices(userId) {
  const db = createAdminClient();

  const { data, error } = await db
    .from("trusted_devices")
    .select("id, device_name, ip_address, trusted_at, last_used")
    .eq("user_id", userId)
    .order("last_used", { ascending: false });

  if (error) {
    console.error("Error getting trusted devices:", error);
    return [];
  }

  return data || [];
}

/**
 * Remove a trusted device
 */
export async function removeTrustedDevice(userId, deviceId) {
  const db = createAdminClient();

  const { error } = await db
    .from("trusted_devices")
    .delete()
    .eq("id", deviceId)
    .eq("user_id", userId);

  if (error) {
    console.error("Error removing trusted device:", error);
    return false;
  }

  return true;
}

/**
 * Create a new IP alert
 */
export async function createNewIpAlert(userId, ipAddress) {
  const db = createAdminClient();

  const { data, error } = await db
    .from("new_ip_alerts")
    .insert({
      user_id: userId,
      ip_address: ipAddress,
      email_sent: false,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Error creating IP alert:", error);
    return null;
  }

  return data;
}

/**
 * Mark alert as emailed
 */
export async function markAlertEmailSent(alertId) {
  const db = createAdminClient();

  const { error } = await db
    .from("new_ip_alerts")
    .update({
      email_sent: true,
      sent_at: new Date().toISOString(),
    })
    .eq("id", alertId);

  if (error) {
    console.error("Error marking alert as sent:", error);
  }
}

/**
 * Get unread IP alerts for user
 */
export async function getUnreadIpAlerts(userId) {
  const db = createAdminClient();

  const { data, error } = await db
    .from("new_ip_alerts")
    .select("id, ip_address, created_at")
    .eq("user_id", userId)
    .eq("dismissed", false)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error getting IP alerts:", error);
    return [];
  }

  return data || [];
}

/**
 * Dismiss an IP alert
 */
export async function dismissIpAlert(userId, alertId) {
  const db = createAdminClient();

  const { error } = await db
    .from("new_ip_alerts")
    .update({
      dismissed: true,
      dismissed_at: new Date().toISOString(),
    })
    .eq("id", alertId)
    .eq("user_id", userId);

  if (error) {
    console.error("Error dismissing alert:", error);
    return false;
  }

  return true;
}
