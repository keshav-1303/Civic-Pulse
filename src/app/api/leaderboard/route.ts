import { NextResponse } from "next/server";
import { CURRENT_USER_ID, listUsers } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ users: await listUsers(), currentUserId: CURRENT_USER_ID });
}
