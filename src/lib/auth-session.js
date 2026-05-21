import { cache } from "react";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import crypto from "crypto";
import { query } from "./db";
import { SESSION_COOKIE } from "./auth-constants";
const SESSION_ISSUER = "da-alf";
const SESSION_AUDIENCE = "da-alf-web";
const MAX_AGE = 60 * 60 * 24 * 7;

const DEFAULT_SECRET = "da-alf-default-secret-please-change-me-32ch";

function getSecretKey() {
  const secret = process.env.AUTH_SECRET ?? DEFAULT_SECRET;
  if (process.env.NODE_ENV === "production" && secret === DEFAULT_SECRET) {
    console.warn("[auth] AUTH_SECRET belum diset di production — menggunakan default. Segera set AUTH_SECRET di Vercel env vars!");
  }
  return new TextEncoder().encode(secret);
}

export async function isStaffRole(role) {
  return role === "admin" || role === "moderator";
}

export async function createSessionCookie(account) {
  const token = await new SignJWT({
    id: account.id,
    username: account.username,
    display_name: account.display_name,
    role: account.role,
    sid: crypto.randomUUID(),
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(SESSION_ISSUER)
    .setAudience(SESSION_AUDIENCE)
    .setSubject(account.id)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecretKey());

  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: MAX_AGE,
    path: "/",
    priority: "high",
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

export async function readSessionPayload() {
  try {
    const jar = await cookies();
    const token = jar.get(SESSION_COOKIE)?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, getSecretKey(), {
      issuer: SESSION_ISSUER,
      audience: SESSION_AUDIENCE,
    });
    return payload;
  } catch {
    return null;
  }
}

export const getCurrentUser = cache(async () => {
  try {
    const payload = await readSessionPayload();
    const id = payload?.sub ?? payload?.id;
    if (!id) return null;

    // Direct SQL query with LEFT JOIN to jabatan
    const { rows } = await query(
      `SELECT a.id, a.display_name, a.username, a.email, a.role, a.profile_picture_url, a.bio,
              a.is_active, a.banned, a.created_at, a.jabatan_id,
              j.id as jab_id, j.nama as jab_nama, j.urutan as jab_urutan
       FROM accounts a
       LEFT JOIN jabatan j ON a.jabatan_id = j.id
       WHERE a.id = $1`,
      [id]
    );

    const account = rows[0];
    if (!account?.is_active || account.banned) return null;

    return {
      id: account.id,
      display_name: account.display_name,
      username: account.username,
      email: account.email,
      role: account.role,
      profile_picture_url: account.profile_picture_url,
      bio: account.bio,
      created_at: account.created_at,
      jabatan_id: account.jabatan_id,
      jabatan: account.jab_id ? { id: account.jab_id, nama: account.jab_nama, urutan: account.jab_urutan } : null,
    };
  } catch (err) {
    console.error("[auth] getCurrentUser error:", err.message);
    return null;
  }
});

export async function getSession() {
  const user = await getCurrentUser();
  if (!user) return null;
  return {
    id: user.id,
    username: user.username,
    display_name: user.display_name,
    role: user.role,
    jabatan_id: user.jabatan_id,
  };
}
