"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod/v4";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

const profileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "სახელი უნდა შეიცავდეს მინიმუმ 2 სიმბოლოს"),
  avatarUrl: z.union([
    z.literal(""),
    z.url("ავატარის მისამართი არასწორია"),
    z.string().startsWith("/", "ავატარის ატვირთვა ვერ დადასტურდა"),
  ]),
});

const passwordSchema = z
  .object({
    password: z.string().min(6, "პაროლი უნდა შეიცავდეს მინიმუმ 6 სიმბოლოს"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "პაროლები არ ემთხვევა",
    path: ["confirmPassword"],
  });

export type ProfileState = {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

export async function updateProfile(
  _prevState: ProfileState,
  formData: FormData
): Promise<ProfileState> {
  const result = profileSchema.safeParse({
    name: formData.get("name"),
    avatarUrl: formData.get("avatarUrl") ?? "",
  });

  if (!result.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const field = String(issue.path[0]);
      if (!fieldErrors[field]) {
        fieldErrors[field] = issue.message;
      }
    }
    return { success: false, fieldErrors };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "ავტორიზაცია აუცილებელია" };
  }

  const { error } = await supabase.auth.updateUser({
    data: {
      name: result.data.name,
      avatar_url: result.data.avatarUrl || null,
    },
  });

  if (error) {
    return { success: false, error: "პროფილის განახლება ვერ მოხერხდა" };
  }

  await prisma.user.updateMany({
    where: { id: user.id },
    data: {
      name: result.data.name,
      avatarUrl: result.data.avatarUrl || null,
    },
  });

  revalidatePath("/profile");
  revalidatePath("/admin/students");
  revalidatePath("/admin/reviews");

  return { success: true };
}

export async function updatePassword(
  _prevState: ProfileState,
  formData: FormData
): Promise<ProfileState> {
  const result = passwordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!result.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const field = String(issue.path[0]);
      if (!fieldErrors[field]) {
        fieldErrors[field] = issue.message;
      }
    }
    return { success: false, fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password: result.data.password,
  });

  if (error) {
    return { success: false, error: "პაროლის შეცვლა ვერ მოხერხდა" };
  }

  return { success: true };
}
