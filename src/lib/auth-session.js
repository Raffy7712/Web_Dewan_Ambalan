import { cache } from "react";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import crypto from "crypto";
import { createAdminClient } from "./supabase";

export const SESSION_COOKIE = "da_session";
const SESSION_ISSUER = "da-alf";
const SESSION_AUDIENCE = "da-alf-web";
const MAX_AGE = 60 * 60 * 24 * 7;

const DEFAULT_SECRET = "da-alf-default-secret-please-change-me-32ch";

function getSecretKey() {
  const secret = process.env.AUTH_SECRET ?? DEFAULT_SECRET;
  if (process.env.NODE_ENV === "production" && secret === DEFAULT_SECRET) {
    throw new Error("AUTH_SECRET wajib diganti di production.");
  }
  return new TextEncoder().encode(secret);
}

export function isStaffRole(role) {
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
  const payload = await readSessionPayload();
  const id = payload?.sub ?? payload?.id;
  if (!id) return null;

  const db = createAdminClient();
  const { data: account, error } = await db
    .from("accounts")
    .select(
      `id, display_name, username, email, role, profile_picture_url, bio,
       is_active, banned, created_at, jabatan_id, jabatan:jabatan(id, nama, urutan)`,
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !account?.is_active || account.banned) return null;

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
    jabatan: account.jabatan,
  };
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
