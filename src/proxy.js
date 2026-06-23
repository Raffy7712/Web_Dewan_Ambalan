import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE = "da_session";
const SESSION_ISSUER = "da-alf";
const SESSION_AUDIENCE = "da-alf-web";
function getSecretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET must be set. Middleware cannot verify sessions safely without it.");
  }
  return new TextEncoder().encode(secret);
}

async function readSession(request) {
  try {
    const token = request.cookies.get(SESSION_COOKIE)?.value;
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

export async function proxy(request, event) {
  const { pathname } = request.nextUrl;

  const needsAuthGate =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/lupa-password" ||
    pathname === "/reset-password" ||
    pathname.startsWith("/profil") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/keuangan") ||
    pathname.startsWith("/daftar-calon-dewan-ambalan");

  if (!needsAuthGate) {
    return NextResponse.next();
  }

  const session = await readSession(request);

  // Redirect logged-in users away from auth pages
  if (
    (pathname === "/login" ||
      pathname === "/register" ||
      pathname === "/lupa-password" ||
      pathname === "/reset-password") &&
    session
  ) {
    return NextResponse.redirect(new URL("/home", request.url));
  }

  // Require login for protected routes
  if (
    (pathname.startsWith("/profil") ||
      pathname.startsWith("/admin") ||
      pathname.startsWith("/keuangan") ||
      pathname.startsWith("/daftar-calon-dewan-ambalan")) &&
    !session
  ) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Admin-only routes
  if (pathname.startsWith("/admin") && session?.role !== "admin") {
    return NextResponse.redirect(new URL("/anggota", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
