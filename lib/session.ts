import { cookies } from "next/headers";
import {
  COOKIE_NAME,
  SESSION_MAX_AGE,
  SessionUser,
  signSessionToken,
  verifySessionToken,
} from "@/lib/session-token";

export async function setSessionCookie(user: SessionUser) {
  const token = await signSessionToken(user);
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}
