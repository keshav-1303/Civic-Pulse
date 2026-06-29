import { NextResponse } from "next/server";
import { buildNotifications, unreadCount } from "@/lib/notifications";

export const dynamic = "force-dynamic";

export async function GET() {
  const notifications = await buildNotifications();
  return NextResponse.json({
    notifications,
    unread: unreadCount(notifications),
  });
}
