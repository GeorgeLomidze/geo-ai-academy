import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { getAdminNotifications } from "@/lib/qa";
import {
  getZodFieldErrors,
  notificationUpdateSchema,
} from "@/lib/validations/qa";

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

    if (parsed.data.markAllRead) {
      await prisma.adminNotification.updateMany({
        where: { isRead: false },
        data: { isRead: true },
      });
    } else if (parsed.data.id) {
      await prisma.adminNotification.update({
        where: { id: parsed.data.id },
        data: { isRead: true },
      });
    }

    return NextResponse.json({
      success: true,
      message: parsed.data.markAllRead
        ? "ყველა შეტყობინება წაკითხულად მოინიშნა"
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
