import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { createClient } from "@/lib/supabase/server";
import { createVideo } from "@/lib/bunny/client";
import { getTusUploadUrl } from "@/lib/bunny/upload";

const uploadSchema = z.object({
  title: z.string().min(1, "ვიდეოს სახელი აუცილებელია"),
});

export async function POST(request: NextRequest) {
  // Auth check — admin only
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "ავტორიზაცია აუცილებელია" },
      { status: 401 }
    );
  }

  if (user.user_metadata?.role !== "admin") {
    // Also check Supabase user metadata for role
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "მხოლოდ ადმინისტრატორს აქვს ატვირთვის უფლება" },
        { status: 403 }
      );
    }
  }

  // Validate body
  const body = await request.json().catch(() => null);
  const result = uploadSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0]?.message ?? "არასწორი მონაცემები" },
      { status: 400 }
    );
  }

  // Create video on Bunny + get upload URL
  try {
    const video = await createVideo(result.data.title);
    const { uploadUrl, headers } = getTusUploadUrl(video.guid);

    return NextResponse.json({
      videoId: video.guid,
      uploadUrl,
      tusHeaders: headers,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "ვიდეოს შექმნა ვერ მოხერხდა";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
