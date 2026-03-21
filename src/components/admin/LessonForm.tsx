"use client";

import { useState } from "react";
import { Loader2, Save } from "lucide-react";
import type { LessonAttachmentRecord } from "@/lib/lesson-attachments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LessonAttachmentsManager } from "./LessonAttachmentsManager";
import { VideoUploader } from "./VideoUploader";

type Lesson = {
  id: string;
  title: string;
  type: "VIDEO" | "TEXT";
  content: string | null;
  bunnyVideoId: string | null;
  duration: number;
  isFree: boolean;
  sortOrder: number;
  attachments: LessonAttachmentRecord[];
};

type LessonFormProps = {
  moduleId: string;
  lesson?: Lesson;
  onSaved: (lesson: Lesson) => void;
  onCancel: () => void;
  onAttachmentsChange?: (attachments: LessonAttachmentRecord[]) => void;
};

export function LessonForm({
  moduleId,
  lesson,
  onSaved,
  onCancel,
  onAttachmentsChange,
}: LessonFormProps) {
  const isEditing = !!lesson;

  const [title, setTitle] = useState(lesson?.title ?? "");
  const [type, setType] = useState<"VIDEO" | "TEXT">(lesson?.type ?? "VIDEO");
  const [content, setContent] = useState(lesson?.content ?? "");
  const [bunnyVideoId, setBunnyVideoId] = useState(
    lesson?.bunnyVideoId ?? ""
  );
  const [duration, setDuration] = useState(lesson?.duration ?? 0);
  const [isFree, setIsFree] = useState(lesson?.isFree ?? false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoProcessing, setVideoProcessing] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const body = isEditing
      ? {
          id: lesson.id,
          title,
          type,
          content: type === "TEXT" ? content : null,
          bunnyVideoId: type === "VIDEO" ? bunnyVideoId : null,
          duration: type === "VIDEO" ? duration : 0,
          isFree,
        }
      : {
          title,
          moduleId,
          type,
          content: type === "TEXT" ? content : undefined,
          bunnyVideoId: type === "VIDEO" ? bunnyVideoId : undefined,
          duration: type === "VIDEO" ? duration : 0,
          isFree,
        };

    try {
      const res = await fetch("/api/admin/lessons", {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "შეცდომა მოხდა");
        return;
      }

      onSaved(data);
    } catch {
      setError("კავშირის შეცდომა");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h4 className="text-sm font-medium text-brand-secondary">
        {isEditing ? "გაკვეთილის რედაქტირება" : "ახალი გაკვეთილი"}
      </h4>

      {error && (
        <div className="rounded-xl border border-brand-danger/20 bg-brand-danger/10 px-3 py-2 text-sm text-brand-danger">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="lesson-title">სახელი *</Label>
          <Input
            id="lesson-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="გაკვეთილის სახელი"
            className="rounded-xl"
            required
          />
        </div>

        {/* Type */}
        <div className="space-y-2">
          <Label>ტიპი</Label>
          <Select
            value={type}
            onValueChange={(v) => setType(v as "VIDEO" | "TEXT")}
          >
            <SelectTrigger className="w-full rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="VIDEO">ვიდეო</SelectItem>
              <SelectItem value="TEXT">ტექსტი</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Video uploader or text content */}
      {type === "VIDEO" ? (
        <div className="space-y-4">
          <VideoUploader
            onUploadComplete={(videoId) => setBunnyVideoId(videoId)}
            onProcessingChange={setVideoProcessing}
            existingVideoId={bunnyVideoId || null}
          />
          <div className="space-y-2">
            <Label htmlFor="duration">ხანგრძლივობა (წამებში)</Label>
            <Input
              id="duration"
              type="number"
              min={0}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              placeholder="მაგ: 600"
              className="max-w-48 rounded-xl"
            />
            <p className="text-xs text-brand-muted">
              {duration > 0 &&
                `${Math.floor(duration / 60)} წუთი ${duration % 60} წამი`}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="lesson-content">შინაარსი *</Label>
          <Textarea
            id="lesson-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="გაკვეთილის ტექსტური შინაარსი..."
            className="min-h-40 rounded-xl"
            required={type === "TEXT"}
          />
        </div>
      )}

      {/* isFree toggle */}
      <div className="flex items-center gap-3">
        <Switch
          id="is-free"
          checked={isFree}
          onCheckedChange={setIsFree}
        />
        <Label htmlFor="is-free" className="cursor-pointer">
          უფასო გაკვეთილი
        </Label>
        <span className="text-xs text-brand-muted">
          უფასო გაკვეთილები ხელმისაწვდომია ყველასთვის
        </span>
      </div>

      <LessonAttachmentsManager
        lessonId={lesson?.id ?? null}
        initialAttachments={lesson?.attachments ?? []}
        onChange={onAttachmentsChange}
      />

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button
          type="submit"
          size="sm"
          className="rounded-xl gap-2"
          disabled={saving || videoProcessing}
        >
          {saving ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : videoProcessing ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Save className="size-3.5" />
          )}
          {videoProcessing
            ? "ვიდეო მუშავდება..."
            : isEditing
              ? "შენახვა"
              : "დამატება"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="rounded-xl"
        >
          გაუქმება
        </Button>
      </div>
    </form>
  );
}
