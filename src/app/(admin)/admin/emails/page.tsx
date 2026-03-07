"use client";

import { useState, useEffect } from "react";
import { Send, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Course = {
  id: string;
  title: string;
};

type SendResult = {
  success: boolean;
  totalRecipients?: number;
  successCount?: number;
  errorCount?: number;
  error?: string;
};

export default function AdminEmailsPage() {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [recipientType, setRecipientType] = useState("all");
  const [courseId, setCourseId] = useState("");
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [result, setResult] = useState<SendResult | null>(null);

  useEffect(() => {
    async function fetchCourses() {
      try {
        const res = await fetch("/api/courses");
        if (res.ok) {
          const data = (await res.json()) as Course[];
          setCourses(data);
        }
      } catch {
        // Courses will be empty, user can still send to all
      }
    }
    fetchCourses();
  }, []);

  function handleSendClick() {
    if (!subject.trim() || !body.trim()) return;
    if (recipientType === "course" && !courseId) return;
    setConfirmOpen(true);
  }

  async function handleConfirmSend() {
    setConfirmOpen(false);
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/admin/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          body,
          recipientType,
          courseId: recipientType === "course" ? courseId : undefined,
        }),
      });

      const data = (await res.json()) as SendResult;

      if (res.ok) {
        setResult(data);
        setSubject("");
        setBody("");
      } else {
        setResult({ success: false, error: data.error ?? "გაგზავნა ვერ მოხერხდა" });
      }
    } catch {
      setResult({ success: false, error: "გაგზავნა ვერ მოხერხდა" });
    } finally {
      setLoading(false);
    }
  }

  const canSend =
    subject.trim() &&
    body.trim() &&
    (recipientType !== "course" || courseId);

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-brand-secondary">
        ემაილები
      </h1>
      <p className="mt-1 text-sm text-brand-muted">
        გაუგზავნეთ ემაილი სტუდენტებს
      </p>

      <div className="mt-6 max-w-2xl rounded-2xl border border-brand-border bg-brand-surface p-6">
        {result && (
          <div
            role="alert"
            className={`mb-6 flex items-start gap-3 rounded-xl border p-4 text-sm ${
              result.success
                ? "border-green-500/20 bg-green-500/10 text-green-400"
                : "border-brand-danger/20 bg-brand-danger/10 text-brand-danger"
            }`}
          >
            {result.success ? (
              <CheckCircle className="mt-0.5 size-4 shrink-0" />
            ) : (
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
            )}
            <div>
              {result.success ? (
                <p>
                  ემაილი წარმატებით გაიგზავნა {result.successCount} მიმღებთან
                  {result.errorCount && result.errorCount > 0
                    ? ` (${result.errorCount} შეცდომა)`
                    : ""}
                </p>
              ) : (
                <p>{result.error}</p>
              )}
            </div>
          </div>
        )}

        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="recipient-type">მიმღებები</Label>
            <Select value={recipientType} onValueChange={setRecipientType}>
              <SelectTrigger
                id="recipient-type"
                className="h-11 rounded-xl"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ყველა სტუდენტი</SelectItem>
                <SelectItem value="course">კურსის მონაწილეები</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {recipientType === "course" && (
            <div className="space-y-2">
              <Label htmlFor="course-select">კურსი</Label>
              <Select value={courseId} onValueChange={setCourseId}>
                <SelectTrigger
                  id="course-select"
                  className="h-11 rounded-xl"
                >
                  <SelectValue placeholder="აირჩიეთ კურსი" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email-subject">სათაური</Label>
            <Input
              id="email-subject"
              placeholder="ემაილის სათაური"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="h-11 rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email-body">ტექსტი</Label>
            <Textarea
              id="email-body"
              placeholder="ემაილის ტექსტი (HTML ფორმატით)"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={10}
              className="min-h-[200px] rounded-xl"
            />
            <p className="text-xs text-brand-muted">
              შეგიძლიათ გამოიყენოთ HTML ტეგები ფორმატირებისთვის
            </p>
          </div>

          <Button
            onClick={handleSendClick}
            disabled={!canSend || loading}
            className="h-11 rounded-xl text-sm font-semibold"
          >
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
            გაგზავნა
          </Button>
        </div>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ემაილის გაგზავნა</AlertDialogTitle>
            <AlertDialogDescription>
              დარწმუნებული ხართ, რომ გსურთ ემაილის გაგზავნა{" "}
              {recipientType === "all"
                ? "ყველა სტუდენტისთვის"
                : "არჩეული კურსის მონაწილეებისთვის"}
              ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>გაუქმება</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSend}>
              გაგზავნა
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
