import { NextRequest, NextResponse } from "next/server";
import { getUserNotificationDelegate } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { getUserNotifications } from "@/lib/qa";
import {
  getZodFieldErrors,
  notificationUpdateSchema,
} from "@/lib/validations/qa";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (!auth.authenticated) {
      return auth.response;
    }

    const result = await getUserNotifications(auth.userId, 12);
    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/notifications failed", error);
    return NextResponse.json(
      { error: "შეტყობინებების ჩატვირთვა ვერ მოხერხდა" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (!auth.authenticated) {
      return auth.response;
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "არასწორი მოთხოვნა" },
        { status: 400 }
      );
    }

    const parsed = notificationUpdateSchema.safeParse(body);
    if (!parsed.success) {
      const fieldErrors = getZodFieldErrors(parsed.error);
      return NextResponse.json(
        {
          error: Object.values(fieldErrors)[0] ?? "არასწორი მონაცემები",
          fieldErrors,
        },
        { status: 400 }
      );
    }

    const userNotification = getUserNotificationDelegate();

    if (!userNotification) {
      return NextResponse.json({
        success: true,
        notifications: [],
        unreadCount: 0,
      });
    }

    if (parsed.data.markAllRead) {
      await userNotification.updateMany({
        where: {
          userId: auth.userId,
          isRead: false,
        },
        data: { isRead: true },
      });
    } else if (parsed.data.id) {
      const notification = await userNotification.findUnique({
        where: { id: parsed.data.id },
        select: {
          id: true,
          userId: true,
        },
      });

      if (!notification || notification.userId !== auth.userId) {
        return NextResponse.json(
          { error: "შეტყობინება ვერ მოიძებნა" },
          { status: 404 }
        );
      }

      await userNotification.update({
        where: { id: parsed.data.id },
        data: { isRead: true },
      });
    }

    return NextResponse.json({
      success: true,
      ...(await getUserNotifications(auth.userId, 12)),
    });
  } catch (error) {
    console.error("PUT /api/notifications failed", error);
    return NextResponse.json(
      { error: "შეტყობინების განახლება ვერ მოხერხდა" },
      { status: 500 }
    );
  }
}
