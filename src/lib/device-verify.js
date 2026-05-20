/**
 * Device & IP Verification Utilities
 * Handles tracking login devices, verifying trusted IPs, and notifying users of new logins
 */

import { query } from "./db";
import { parseUserAgent, hashUserAgent } from "./device-utils";

/**
 * Check if IP is trusted for user
 * Returns { trusted: boolean, deviceName: string }
 */
export async function checkTrustedIp(userId, ipAddress) {
  try {
    const { rows } = await query(
      `SELECT device_name FROM trusted_devices WHERE user_id = $1 AND ip_address = $2`,
      [userId, ipAddress]
    );
    const data = rows[0] ?? null;
    return {
      trusted: !!data,
      deviceName: data?.device_name || null,
    };
  } catch (err) {
    console.error("Error checking trusted IP:", err);
    return { trusted: false, deviceName: null };
  }
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
  const deviceName = parseUserAgent(userAgent);
  const deviceFingerprint = hashUserAgent(userAgent);

  // Record the login session
  let sessionData;
  try {
    const { rows } = await query(
      `INSERT INTO login_sessions (user_id, ip_address, user_agent, device_name, is_verified, verified_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [
        userId,
        ipAddress,
        userAgent,
        deviceName,
        autoTrust,
        autoTrust ? new Date().toISOString() : null,
      ]
    );
    sessionData = rows[0] ?? null;
  } catch (err) {
    console.error("Error recording login session:", err);
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
  try {
    const { rows } = await query(
      `INSERT INTO trusted_devices (user_id, ip_address, device_name, device_fingerprint, last_used)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, ip_address) DO UPDATE SET
         device_name = EXCLUDED.device_name,
         device_fingerprint = EXCLUDED.device_fingerprint,
         last_used = EXCLUDED.last_used
       RETURNING id`,
      [userId, ipAddress, deviceName, deviceFingerprint, new Date().toISOString()]
    );
    return rows[0] || null;
  } catch (err) {
    console.error("Error trusting device:", err);
    return null;
  }
}

/**
 * Get count of trusted devices for user
 */
export async function getTrustedDeviceCount(userId) {
  try {
    const { rows } = await query(
      `SELECT COUNT(*) as count FROM trusted_devices WHERE user_id = $1`,
      [userId]
    );
    return Number(rows[0]?.count) || 0;
  } catch (err) {
    console.error("Error getting trusted device count:", err);
    return 0;
  }
}

/**
 * Get user's login history
 */
export async function getLoginHistory(userId, limit = 10) {
  try {
    const { rows } = await query(
      `SELECT id, ip_address, device_name, login_timestamp, is_verified
       FROM login_sessions
       WHERE user_id = $1
       ORDER BY login_timestamp DESC
       LIMIT $2`,
      [userId, limit]
    );
    return rows || [];
  } catch (err) {
    console.error("Error getting login history:", err);
    return [];
  }
}

/**
 * Get user's trusted devices
 */
export async function getTrustedDevices(userId) {
  try {
    const { rows } = await query(
      `SELECT id, device_name, ip_address, trusted_at, last_used
       FROM trusted_devices
       WHERE user_id = $1
       ORDER BY last_used DESC`,
      [userId]
    );
    return rows || [];
  } catch (err) {
    console.error("Error getting trusted devices:", err);
    return [];
  }
}

/**
 * Remove a trusted device
 */
export async function removeTrustedDevice(userId, deviceId) {
  try {
    await query(
      `DELETE FROM trusted_devices WHERE id = $1 AND user_id = $2`,
      [deviceId, userId]
    );
    return true;
  } catch (err) {
    console.error("Error removing trusted device:", err);
    return false;
  }
}

/**
 * Create a new IP alert
 */
export async function createNewIpAlert(userId, ipAddress) {
  try {
    const { rows } = await query(
      `INSERT INTO new_ip_alerts (user_id, ip_address, email_sent)
       VALUES ($1, $2, false)
       RETURNING id`,
      [userId, ipAddress]
    );
    return rows[0] ?? null;
  } catch (err) {
    console.error("Error creating IP alert:", err);
    return null;
  }
}

/**
 * Mark alert as emailed
 */
export async function markAlertEmailSent(alertId) {
  try {
    await query(
      `UPDATE new_ip_alerts SET email_sent = true, sent_at = $1 WHERE id = $2`,
      [new Date().toISOString(), alertId]
    );
  } catch (err) {
    console.error("Error marking alert as sent:", err);
  }
}

/**
 * Get unread IP alerts for user
 */
export async function getUnreadIpAlerts(userId) {
  try {
    const { rows } = await query(
      `SELECT id, ip_address, created_at
       FROM new_ip_alerts
       WHERE user_id = $1 AND dismissed = false
       ORDER BY created_at DESC`,
      [userId]
    );
    return rows || [];
  } catch (err) {
    console.error("Error getting IP alerts:", err);
    return [];
  }
}

/**
 * Dismiss an IP alert
 */
export async function dismissIpAlert(userId, alertId) {
  try {
    await query(
      `UPDATE new_ip_alerts SET dismissed = true, dismissed_at = $1 WHERE id = $2 AND user_id = $3`,
      [new Date().toISOString(), alertId, userId]
    );
    return true;
  } catch (err) {
    console.error("Error dismissing alert:", err);
    return false;
  }
}
