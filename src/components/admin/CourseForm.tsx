"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save } from "lucide-react";
import { slugify } from "@/lib/slugify";
import { ImageUploader } from "@/components/admin/ImageUploader";

type CourseData = {
  id?: string;
  title: string;
  slug: string;
  description: string | null;
  shortDescription: string | null;
  thumbnailUrl: string | null;
  price: number;
};

export function CourseForm({ course }: { course?: CourseData }) {
  const router = useRouter();
  const isEditing = !!course?.id;

  const [title, setTitle] = useState(course?.title ?? "");
  const [slug, setSlug] = useState(course?.slug ?? "");
  const [description, setDescription] = useState(course?.description ?? "");
  const [shortDescription, setShortDescription] = useState(
    course?.shortDescription ?? ""
  );
  const [thumbnailUrl, setThumbnailUrl] = useState(
    course?.thumbnailUrl ?? ""
  );
  const [price, setPrice] = useState(course?.price ?? 0);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleTitleChange(value: string) {
    setTitle(value);
    if (!slugManuallyEdited) {
      setSlug(slugify(value));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const body = {
      title,
      description,
      shortDescription: shortDescription || undefined,
      thumbnailUrl: thumbnailUrl || undefined,
      price,
    };

    try {
      const url = isEditing
        ? `/api/admin/courses/${course.id}`
        : "/api/admin/courses";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "შეცდომა მოხდა");
        return;
      }

      if (isEditing) {
        router.refresh();
      } else {
        router.push(`/admin/courses/${data.id}`);
      }
    } catch {
      setError("კავშირის შეცდომა");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-xl border border-brand-danger/20 bg-brand-danger/10 px-4 py-3 text-sm text-brand-danger">
          {error}
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Title */}
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="title">კურსის სახელი *</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="მაგ: AI Content Creation"
            className="rounded-xl"
            required
          />
        </div>

        {/* Slug */}
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="slug">URL სლაგი</Label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-brand-muted">/courses/</span>
            <Input
              id="slug"
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setSlugManuallyEdited(true);
              }}
              placeholder="ai-content-creation"
              className="rounded-xl"
              disabled={isEditing}
            />
          </div>
          {!isEditing && (
            <p className="text-xs text-brand-muted">
              ავტომატურად გენერირდება სახელიდან. შეგიძლიათ შეცვალოთ.
            </p>
          )}
        </div>

        {/* Description */}
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="description">აღწერა *</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="კურსის სრული აღწერა..."
            className="min-h-32 rounded-xl"
            required
          />
        </div>

        {/* Short description */}
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="shortDescription">მოკლე აღწერა</Label>
          <Textarea
            id="shortDescription"
            value={shortDescription}
            onChange={(e) => setShortDescription(e.target.value)}
            placeholder="კატალოგის ბარათზე ნაჩვენები მოკლე აღწერა"
            className="min-h-20 rounded-xl"
          />
        </div>

        {/* Thumbnail Upload */}
        <div className="space-y-2">
          <Label>კურსის სურათი</Label>
          <ImageUploader
            value={thumbnailUrl}
            onChange={setThumbnailUrl}
          />
        </div>

        {/* Price */}
        <div className="space-y-2">
          <Label htmlFor="price">ფასი (₾)</Label>
          <div className="relative">
            <Input
              id="price"
              type="number"
              min={0}
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              className="rounded-xl pr-10"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-brand-muted">
              ₾
            </span>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" className="rounded-xl gap-2" disabled={saving}>
          {saving ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          {isEditing ? "შენახვა" : "კურსის შექმნა"}
        </Button>
      </div>
    </form>
  );
}
