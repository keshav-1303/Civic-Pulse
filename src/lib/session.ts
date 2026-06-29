import { cookies } from "next/headers";
import { COOKIE_NAME, verifySession, type SessionUser } from "./auth";

/** Reads and verifies the current session in a server component or route handler. */
export async function getServerSession(): Promise<SessionUser | null> {
  const store = await cookies();
  return verifySession(store.get(COOKIE_NAME)?.value);
}
