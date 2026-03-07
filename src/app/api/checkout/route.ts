import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { createCheckoutUrl } from "@/lib/flitt/client";
import { siteConfig } from "@/lib/constants";

const checkoutSchema = z.object({
  courseId: z.string().uuid("არასწორი კურსის ID"),
});

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (!auth.authenticated) return auth.response;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "არასწორი მოთხოვნა" },
        { status: 400 },
      );
    }

    const parsed = checkoutSchema.safeParse(body);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      return NextResponse.json(
        { error: firstIssue?.message ?? "არასწორი მონაცემები" },
        { status: 400 },
      );
    }

    const { courseId } = parsed.data;

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, title: true, price: true, status: true },
    });

    if (!course) {
      return NextResponse.json(
        { error: "კურსი ვერ მოიძებნა" },
        { status: 404 },
      );
    }

    if (course.status !== "PUBLISHED") {
      return NextResponse.json(
        { error: "ეს კურსი ამჟამად მიუწვდომელია" },
        { status: 400 },
      );
    }

    if (course.price === 0) {
      return NextResponse.json(
        { error: "ეს კურსი უფასოა, გამოიყენეთ ჩაწერის ღილაკი" },
        { status: 400 },
      );
    }

    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: auth.userId,
          courseId,
        },
      },
    });

    if (existingEnrollment) {
      return NextResponse.json(
        { error: "თქვენ უკვე ჩაწერილი ხართ ამ კურსზე" },
        { status: 409 },
      );
    }

    const order = await prisma.order.create({
      data: {
        userId: auth.userId,
        courseId,
        amount: course.price,
        currency: "GEL",
        status: "PENDING",
      },
    });

    const baseUrl = siteConfig.url;
    const { checkoutUrl, paymentId } = await createCheckoutUrl({
      orderId: order.id,
      amount: course.price,
      currency: "GEL",
      description: `GEO AI Academy — ${course.title}`,
      callbackUrl: `${baseUrl}/api/webhooks/flitt`,
      responseUrl: `${baseUrl}/api/checkout/success`,
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { flittPaymentId: paymentId },
    });

    return NextResponse.json({ checkoutUrl });
  } catch (error) {
    console.error("POST /api/checkout failed", error);
    return NextResponse.json(
      { error: "გადახდის ინიციალიზაცია ვერ მოხერხდა, სცადეთ თავიდან" },
      { status: 500 },
    );
  }
}
