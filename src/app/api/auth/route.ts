import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME, getPersona, signSession, SESSION_MAX_AGE } from "@/lib/auth";
import { getServerSession } from "@/lib/session";

export const dynamic = "force-dynamic";

/** whoami: returns the current session (or null). */
export async function GET() {
  const session = await getServerSession();
  return NextResponse.json({ session });
}

/** login: sign in as a demo persona. */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const personaId = body.personaId as string | undefined;
  const persona = personaId ? getPersona(personaId) : undefined;
  if (!persona) {
    return NextResponse.json({ error: "Unknown persona" }, { status: 400 });
  }

  const token = await signSession({ sub: persona.sub, name: persona.name, role: persona.role });
  const res = NextResponse.json({
    session: { sub: persona.sub, name: persona.name, role: persona.role },
  });
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return res;
}

/** logout */
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}
