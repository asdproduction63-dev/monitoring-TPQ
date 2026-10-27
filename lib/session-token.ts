import { SignJWT, jwtVerify } from "jose";

export const COOKIE_NAME = "santri_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

export type SessionRole = "ADMIN" | "USTADZ" | "WALI";

export type SessionUser = {
  id: number;
  name: string;
  username: string;
  role: SessionRole;
};

export function toSessionRole(value: unknown): SessionRole {
  return value === "ADMIN" ? "ADMIN" : value === "WALI" ? "WALI" : "USTADZ";
}

function getSecret() {
  const value = process.env.AUTH_SECRET;
  if (!value && process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET belum diatur. Isi variabel AUTH_SECRET di file .env.");
  }
  return new TextEncoder().encode(
    value || "dev-secret-santri-monitor-jangan-dipakai-di-produksi",
  );
}

export async function signSessionToken(user: SessionUser) {
  return new SignJWT({ name: user.name, username: user.username, role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(user.id))
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(getSecret());
}

export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    const id = Number(payload.sub);
    if (!Number.isFinite(id)) return null;
    const role = toSessionRole(payload.role);
    return {
      id,
      name: typeof payload.name === "string" ? payload.name : "",
      username: typeof payload.username === "string" ? payload.username : "",
      role,
    };
  } catch {
    return null;
  }
}
