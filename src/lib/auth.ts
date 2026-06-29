import { SignJWT, jwtVerify } from "jose";
import { SESSION_MAX_AGE, type Role, type SessionUser } from "./roles";

// Re-export the pure helpers so existing imports from "@/lib/auth" keep working.
export * from "./roles";

function secret(): Uint8Array {
  const s = process.env.AUTH_SECRET || "civicpulse-dev-secret-change-me-in-production";
  return new TextEncoder().encode(s);
}

export async function signSession(user: SessionUser): Promise<string> {
  return new SignJWT({ name: user.name, role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(secret());
}

export async function verifySession(token: string | undefined): Promise<SessionUser | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (!payload.sub || !payload.role) return null;
    return { sub: payload.sub, name: String(payload.name ?? "User"), role: payload.role as Role };
  } catch {
    return null;
  }
}
