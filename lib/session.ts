// lib/session.ts
// Unified server-side authentication and authorization helper using signed HttpOnly session cookies.

import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verifySessionToken, isAdminUser, VerifiedSessionPayload } from "@/lib/auth-security";
import { getUserById, isTokenRevoked, StoredUser } from "@/lib/data-store";

export const SESSION_COOKIE_NAME = "cribconnect_session";

export interface AuthenticatedContext {
  user: StoredUser;
  tokenPayload: VerifiedSessionPayload;
  isAdmin: boolean;
}

/**
 * Verifies the signed HttpOnly session cookie, checks server-side revocation,
 * and loads the real user record from the persistent store.
 * Returns null if unauthenticated, expired, revoked, or missing.
 */
export async function getSessionContext(): Promise<AuthenticatedContext | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;

    const payload = verifySessionToken(token);
    if (!payload) return null;

    if (payload.jti && (await isTokenRevoked(payload.jti))) {
      return null;
    }

    const user = await getUserById(payload.userId);
    if (!user) return null;

    return {
      user,
      tokenPayload: payload,
      isAdmin: isAdminUser(user),
    };
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<StoredUser | null> {
  const ctx = await getSessionContext();
  return ctx ? ctx.user : null;
}

export async function requireAuth(): Promise<
  { ok: true; context: AuthenticatedContext } | { ok: false; response: NextResponse }
> {
  const context = await getSessionContext();
  if (!context) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Authentication required." }, { status: 401 }),
    };
  }
  return { ok: true, context };
}

export async function requireAdmin(): Promise<
  { ok: true; context: AuthenticatedContext } | { ok: false; response: NextResponse }
> {
  const context = await getSessionContext();
  if (!context) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Authentication required." }, { status: 401 }),
    };
  }
  if (!context.isAdmin) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Admin access required." }, { status: 403 }),
    };
  }
  return { ok: true, context };
}
