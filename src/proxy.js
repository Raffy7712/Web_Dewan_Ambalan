import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE = "da_session";
const SESSION_ISSUER = "da-alf";
const SESSION_AUDIENCE = "da-alf-web";

function getSecretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    console.error("AUTH_SECRET is not set — auth middleware cannot verify sessions");
    return new TextEncoder().encode("");
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

function schedulePageViewLog(request, event) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/api") || pathname.startsWith("/_next")) return;

  const secret = process.env.INTERNAL_ANALYTICS_SECRET;
  if (!secret) return;

  const origin = request.nextUrl.origin;
  const promise = fetch(`${origin}/api/internal/page-view`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-da-internal": secret,
    },
    body: JSON.stringify({ path: pathname }),
  }).catch(() => {});

  // Must call as event.waitUntil(p) — extracting waitUntil loses `this` and throws
  // (e.g. Cannot read properties of undefined reading Symbol(waitUntil)).
  if (event && typeof event.waitUntil === "function") {
    event.waitUntil(promise);
  } else {
    void promise;
  }
}

export async function proxy(request, event) {
  const { pathname } = request.nextUrl;
  schedulePageViewLog(request, event);

  const needsAuthGate =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname.startsWith("/profil") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/keuangan") ||
    pathname.startsWith("/daftar-ambalan") ||
    pathname.startsWith("/vouchers");

  if (!needsAuthGate) {
    return NextResponse.next();
  }

  const session = await readSession(request);

  if ((pathname === "/login" || pathname === "/register") && session) {
    return NextResponse.redirect(new URL("/home", request.url));
  }

  if (
    (pathname.startsWith("/profil") ||
      pathname.startsWith("/admin") ||
      pathname.startsWith("/keuangan") ||
      pathname.startsWith("/daftar-ambalan") ||
      pathname.startsWith("/vouchers")) &&
    !session
  ) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith("/admin") && session?.role !== "admin") {
    return NextResponse.redirect(new URL("/anggota", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
