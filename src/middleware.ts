import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_NAME, verifySession, canViewCopilot } from "@/lib/auth";

export async function middleware(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  const session = await verifySession(token);

  if (!canViewCopilot(session?.role)) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(req.nextUrl.pathname)}&reason=staff`;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/admin"],
};
