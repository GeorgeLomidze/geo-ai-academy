import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { getAdminNotificationDelegate, prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { getAdminNotifications, getQuestionIdFromNotificationLink } from "@/lib/qa";
import {
  getZodFieldErrors,
  notificationUpdateSchema,
} from "@/lib/validations/qa";

function revalidateAdminNotificationPaths() {
  revalidatePath("/admin");
  revalidatePath("/admin/qa");
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authorized) {
      return auth.response;
    }

    const result = await getAdminNotifications(12);
    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/admin/notifications failed", error);
    return NextResponse.json(
      { error: "შეტყობინებების ჩატვირთვა ვერ მოხერხდა" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authorized) {
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

    const adminNotification = getAdminNotificationDelegate();

    if (!adminNotification) {
      return NextResponse.json({
        success: true,
        notifications: [],
        unreadCount: 0,
      });
    }

    if (parsed.data.markAllRead) {
      const now = new Date();

      await Promise.all([
        adminNotification.updateMany({
          where: { isRead: false },
          data: { isRead: true },
        }),
        prisma.question.updateMany({
          where: { adminReadAt: null },
          data: { adminReadAt: now },
        }),
      ]);
    } else if (parsed.data.questionId) {
      const question = await prisma.question.findUnique({
        where: { id: parsed.data.questionId },
        select: {
          id: true,
        },
      });

      if (!question) {
        return NextResponse.json(
          { error: "კითხვა ვერ მოიძებნა" },
          { status: 404 }
        );
      }

      await Promise.all([
        prisma.question.updateMany({
          where: {
            id: parsed.data.questionId,
            adminReadAt: null,
          },
          data: { adminReadAt: new Date() },
        }),
        adminNotification.updateMany({
          where: {
            isRead: false,
            linkUrl: {
              contains: parsed.data.questionId,
            },
          },
          data: { isRead: true },
        }),
      ]);
    } else if (parsed.data.id) {
      const notification = await adminNotification.findUnique({
        where: { id: parsed.data.id },
        select: {
          id: true,
          linkUrl: true,
        },
      });

      if (!notification) {
        return NextResponse.json(
          { error: "შეტყობინება ვერ მოიძებნა" },
          { status: 404 }
        );
      }

      const questionId = getQuestionIdFromNotificationLink(notification.linkUrl);

      await Promise.all([
        adminNotification.update({
          where: { id: parsed.data.id },
          data: { isRead: true },
        }),
        questionId
          ? prisma.question.updateMany({
              where: {
                id: questionId,
                adminReadAt: null,
              },
              data: { adminReadAt: new Date() },
            })
          : Promise.resolve(),
      ]);
    }

    revalidateAdminNotificationPaths();

    return NextResponse.json({
      success: true,
      message: parsed.data.markAllRead
        ? "ყველა შეტყობინება წაკითხულად მოინიშნა"
        : parsed.data.questionId
          ? "კითხვა წაკითხულად მოინიშნა"
        : "შეტყობინება წაკითხულად მოინიშნა",
      ...(await getAdminNotifications(12)),
    });
  } catch (error) {
    console.error("PUT /api/admin/notifications failed", error);
    return NextResponse.json(
      { error: "შეტყობინების განახლება ვერ მოხერხდა" },
      { status: 500 }
    );
  }
}
