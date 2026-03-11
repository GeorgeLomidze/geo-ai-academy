"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  CheckCircle,
  LogIn,
  Loader2,
  Mail,
  MapPin,
} from "lucide-react";
import { z } from "zod/v4";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const contactHighlights = [
  {
    icon: Mail,
    title: "ელფოსტა",
    value: "hello@geoaiacademy.com",
  },
  {
    icon: MapPin,
    title: "ლოკაცია",
    value: "თბილისი, საქართველო",
  },
] as const;

const contactFieldClassName =
  "h-12 rounded-lg border border-transparent bg-white/5 px-4 text-sm text-brand-secondary placeholder:text-brand-muted/50 transition-[background-color,border-color,box-shadow] duration-200 ease-out focus-visible:border-brand-primary/70 focus-visible:bg-white/8 focus-visible:ring-0";

const contactTextareaClassName =
  "brand-scrollbar min-h-[13rem] rounded-lg border border-transparent bg-white/5 px-4 py-3 text-sm text-brand-secondary placeholder:text-brand-muted/50 transition-[background-color,border-color,box-shadow] duration-200 ease-out focus-visible:border-brand-primary/70 focus-visible:bg-white/8 focus-visible:ring-0 resize-none overflow-y-auto";

const contactSchema = z.object({
  name: z.string().min(2, "სახელი უნდა შეიცავდეს მინიმუმ 2 სიმბოლოს"),
  subject: z
    .string()
    .min(2, "თემა უნდა შეიცავდეს მინიმუმ 2 სიმბოლოს"),
  message: z
    .string()
    .min(10, "შეტყობინება უნდა შეიცავდეს მინიმუმ 10 სიმბოლოს"),
});

type FieldErrors = Partial<Record<"name" | "subject" | "message", string>>;
type EditableField = "name" | "subject" | "message";

type ContactSectionProps = {
  user: {
    name: string;
    email: string;
  } | null;
};

export function ContactSection({ user }: ContactSectionProps) {
  const [formData, setFormData] = useState({
    name: user?.name ?? "",
    email: user?.email ?? "",
    subject: "",
    message: "",
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  function updateField(field: EditableField, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
    if (serverError) setServerError("");
    if (success) setSuccess(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError("");

    const result = contactSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: FieldErrors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof FieldErrors;
        if (!fieldErrors[field]) {
          fieldErrors[field] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token
            ? { Authorization: `Bearer ${session.access_token}` }
            : {}),
        },
        credentials: "include",
        body: JSON.stringify({
          name: formData.name,
          subject: formData.subject,
          message: formData.message,
        }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        setServerError(data.error ?? "შეტყობინების გაგზავნა ვერ მოხერხდა");
        return;
      }

      setSuccess(true);
      setFormData((prev) => ({ ...prev, subject: "", message: "" }));
    } catch {
      setServerError("შეტყობინების გაგზავნა ვერ მოხერხდა");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section
      id="contact"
      className="relative isolate scroll-mt-24 overflow-hidden border-t border-brand-border bg-brand-background"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-12 h-64 w-64 -translate-x-1/2 rounded-full bg-brand-primary/10 blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-px bg-brand-border" />
      </div>

      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="relative grid gap-10 lg:grid-cols-[0.92fr_1.08fr] lg:gap-12">
          <div className="relative grid gap-6 self-start">
            <div className="w-fit rounded-full border border-white/10 bg-white/5 px-4 py-2 backdrop-blur-sm">
              <span className="inline-flex items-center gap-2 text-sm font-medium text-brand-secondary">
                <span className="size-2 rounded-full bg-brand-primary" />
                კონტაქტი
              </span>
            </div>

            <div className="max-w-xl">
              <h2 className="text-4xl sm:text-5xl">დაგვიკავშირდი</h2>
              <p className="mt-4 max-w-lg text-sm leading-7 text-brand-muted sm:text-base">
                თუ გინდა მეტი ინფორმაცია კურსებზე, პარტნიორობაზე ან თანამშრომლობაზე,
                მოგვწერე და გიპასუხებთ მოკლე დროში.
              </p>
            </div>

            <div className="grid gap-4 self-start">
              {contactHighlights.map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.title}
                    className="flex min-w-0 items-center gap-4 rounded-[1.35rem] border border-white/10 bg-[#0e0e0e] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                  >
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-white/8 bg-transparent text-brand-primary">
                      <Icon className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-brand-secondary">
                        {item.title}
                      </p>
                      <p className="mt-1 break-words text-sm text-brand-secondary text-pretty">
                        {item.value}
                      </p>
                    </div>
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/6 text-brand-secondary">
                      <ArrowUpRight className="size-4" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="relative self-start p-1">
            <div className="w-full rounded-2xl bg-white/[0.03] p-5 sm:p-6">
              {!user ? (
                <div className="grid gap-4 rounded-xl border border-white/10 bg-white/[0.02] p-5">
                  <div
                    role="status"
                    className="rounded-lg border border-brand-primary/20 bg-brand-primary/10 px-4 py-3 text-sm text-brand-secondary"
                  >
                    კონტაქტის ფორმით მოსაწერად საჭიროა ავტორიზაცია.
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Button asChild className="h-12 rounded-[0.9rem] px-6 text-sm font-semibold">
                      <Link href="/login">
                        <LogIn className="size-4" />
                        შესვლა
                      </Link>
                    </Button>
                    <Button
                      asChild
                      variant="outline"
                      className="h-12 rounded-[0.9rem] px-6 text-sm font-semibold"
                    >
                      <Link href="/register">რეგისტრაცია</Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="grid min-h-0 gap-4">
                  {serverError && (
                    <div role="alert" className="rounded-lg border border-brand-danger/20 bg-brand-danger/10 px-4 py-3 text-sm text-brand-danger">
                      {serverError}
                    </div>
                  )}

                  {success && (
                    <div role="status" className="flex items-center gap-2 rounded-lg border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-400">
                      <CheckCircle className="size-4 shrink-0" />
                      შეტყობინება წარმატებით გაიგზავნა
                    </div>
                  )}

                  <div className="grid gap-4">
                    <div>
                      <Input
                        id="contact-name"
                        name="name"
                        aria-label="სახელი"
                        placeholder="სახელი"
                        value={formData.name}
                        onChange={(e) => updateField("name", e.target.value)}
                        className={contactFieldClassName}
                        aria-invalid={!!errors.name}
                      />
                      {errors.name && (
                        <p className="mt-1 text-xs text-brand-danger">{errors.name}</p>
                      )}
                    </div>
                    <div>
                      <Input
                        id="contact-email"
                        name="email"
                        type="email"
                        aria-label="ელფოსტა"
                        placeholder="ელფოსტა"
                        value={formData.email}
                        readOnly
                        className={contactFieldClassName}
                        aria-readonly="true"
                      />
                    </div>
                    <div>
                      <Input
                        id="contact-subject"
                        name="subject"
                        aria-label="თემა"
                        placeholder="subject / თემა"
                        value={formData.subject}
                        onChange={(e) => updateField("subject", e.target.value)}
                        className={contactFieldClassName}
                        aria-invalid={!!errors.subject}
                      />
                      {errors.subject && (
                        <p className="mt-1 text-xs text-brand-danger">{errors.subject}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-1">
                    <Textarea
                      id="contact-message"
                      name="message"
                      rows={5}
                      aria-label="შეტყობინება"
                      placeholder="შეტყობინება"
                      value={formData.message}
                      onChange={(e) => updateField("message", e.target.value)}
                      className={contactTextareaClassName}
                      aria-invalid={!!errors.message}
                    />
                    {errors.message && (
                      <p className="text-xs text-brand-danger">{errors.message}</p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="h-12 w-full rounded-[0.9rem] bg-brand-accent px-6 text-sm font-semibold text-black shadow-none transition-colors duration-200 hover:bg-brand-accent-hover"
                  >
                    {loading && <Loader2 className="size-4 animate-spin" />}
                    გაგზავნა
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
