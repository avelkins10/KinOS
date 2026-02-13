import { NextResponse } from "next/server";
import {
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} from "@/lib/actions/notifications";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limitStr = searchParams.get("limit");
    const limit = limitStr ? parseInt(limitStr, 10) : 20;
    const countOnly = searchParams.get("countOnly") === "true";

    if (countOnly) {
      const { count, error } = await getUnreadCount();
      if (error) {
        return NextResponse.json({ error }, { status: 400 });
      }
      return NextResponse.json({ count });
    }

    const { data, error } = await getMyNotifications(limit);
    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }
    return NextResponse.json({ data });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to fetch notifications" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { notificationId, markAll } = body as {
      notificationId?: string;
      markAll?: boolean;
    };

    if (markAll) {
      const { error } = await markAllAsRead();
      if (error) {
        return NextResponse.json({ error }, { status: 400 });
      }
      return NextResponse.json({ success: true });
    }

    if (notificationId) {
      const { error } = await markAsRead(notificationId);
      if (error) {
        return NextResponse.json({ error }, { status: 400 });
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: "notificationId or markAll required" },
      { status: 400 },
    );
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to update notifications" },
      { status: 500 },
    );
  }
}
