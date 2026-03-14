import {
  File,
  FileArchive,
  FileImage,
  FileSpreadsheet,
  FileText,
  type LucideIcon,
} from "lucide-react";

export type LessonAttachmentRecord = {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  fileType: string;
  lessonId: string;
  createdAt: string;
};

export const LESSON_ATTACHMENTS_BUCKET = "lesson-materials";
export const MAX_LESSON_ATTACHMENT_SIZE = 50 * 1024 * 1024;

const EXACT_ALLOWED_TYPES = new Set([
  "application/pdf",
  "application/zip",
  "application/x-zip-compressed",
  "application/vnd.rar",
  "application/x-rar-compressed",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
]);

const ALLOWED_EXTENSIONS = new Set([
  "pdf",
  "zip",
  "rar",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "ppt",
  "pptx",
  "txt",
  "jpg",
  "jpeg",
  "png",
  "webp",
  "gif",
  "bmp",
  "svg",
  "avif",
]);

function getFileExtension(fileName: string) {
  const normalized = fileName.trim().toLowerCase();
  const parts = normalized.split(".");
  return parts.length > 1 ? parts.at(-1) ?? "" : "";
}

export function isAllowedLessonAttachment(file: {
  type: string;
  name: string;
}) {
  if (file.type.startsWith("image/")) {
    return true;
  }

  if (EXACT_ALLOWED_TYPES.has(file.type)) {
    return true;
  }

  return ALLOWED_EXTENSIONS.has(getFileExtension(file.name));
}

export function sanitizeAttachmentFileName(fileName: string) {
  const extension = getFileExtension(fileName);
  const baseName = extension
    ? fileName.slice(0, -(extension.length + 1))
    : fileName;

  const sanitizedBase = baseName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);

  const safeBase = sanitizedBase || "file";
  return extension ? `${safeBase}.${extension}` : safeBase;
}

export function formatAttachmentSize(fileSize: number) {
  if (fileSize < 1024) {
    return `${fileSize} B`;
  }

  if (fileSize < 1024 * 1024) {
    return `${(fileSize / 1024).toFixed(fileSize < 10 * 1024 ? 1 : 0)} KB`;
  }

  return `${(fileSize / (1024 * 1024)).toFixed(fileSize < 10 * 1024 * 1024 ? 1 : 0)} MB`;
}

export function getAttachmentIcon(fileType: string, fileName: string): LucideIcon {
  const normalizedType = fileType.toLowerCase();
  const extension = getFileExtension(fileName);

  if (normalizedType.startsWith("image/")) {
    return FileImage;
  }

  if (
    normalizedType.includes("sheet") ||
    normalizedType.includes("excel") ||
    extension === "xls" ||
    extension === "xlsx"
  ) {
    return FileSpreadsheet;
  }

  if (
    normalizedType.includes("zip") ||
    normalizedType.includes("rar") ||
    extension === "zip" ||
    extension === "rar"
  ) {
    return FileArchive;
  }

  if (
    normalizedType.includes("pdf") ||
    normalizedType.includes("word") ||
    normalizedType.includes("presentation") ||
    normalizedType.startsWith("text/") ||
    ["pdf", "doc", "docx", "ppt", "pptx", "txt"].includes(extension)
  ) {
    return FileText;
  }

  return File;
}

export function serializeLessonAttachment<
  TAttachment extends {
    id: string;
    fileName: string;
    fileUrl: string;
    fileSize: number;
    fileType: string;
    lessonId: string;
    createdAt: Date;
  },
>(attachment: TAttachment): LessonAttachmentRecord {
  return {
    id: attachment.id,
    fileName: attachment.fileName,
    fileUrl: attachment.fileUrl,
    fileSize: attachment.fileSize,
    fileType: attachment.fileType,
    lessonId: attachment.lessonId,
    createdAt: attachment.createdAt.toISOString(),
  };
}
