"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Layers, MoreVertical, Pencil, Copy, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import type { ProjectSummary } from "./types";

function relativeTime(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "ახლახანს";
  if (minutes < 60) return `${minutes} წუთის წინ`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} საათის წინ`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} დღის წინ`;
  const months = Math.floor(days / 30);
  return `${months} თვის წინ`;
}

interface ProjectCardProps {
  project: ProjectSummary;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onRename: (id: string, title: string) => void;
}

export function ProjectCard({
  project,
  onDelete,
  onDuplicate,
  onRename,
}: ProjectCardProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(project.title);

  function handleRename() {
    const trimmed = title.trim();
    if (trimmed && trimmed !== project.title) {
      onRename(project.id, trimmed);
    } else {
      setTitle(project.title);
    }
    setEditing(false);
  }

  return (
    <div
      className="group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-brand-border bg-brand-surface transition-colors hover:border-brand-accent/30"
      onClick={() => router.push(`/ai-tools/projects/${project.id}`)}
    >
      <div className="flex aspect-[16/10] items-center justify-center bg-brand-background">
        {project.thumbnail ? (
          <img
            src={project.thumbnail}
            alt={project.title}
            className="size-full object-cover"
          />
        ) : (
          <Layers className="size-10 text-brand-muted/40" />
        )}
      </div>

      <div className="flex items-center gap-2 px-4 py-3">
        <div className="min-w-0 flex-1">
          {editing ? (
            <input
              className="w-full rounded border border-brand-border bg-brand-background px-2 py-0.5 text-sm text-brand-secondary outline-none focus:border-brand-accent"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleRename}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRename();
                if (e.key === "Escape") {
                  setTitle(project.title);
                  setEditing(false);
                }
              }}
              onClick={(e) => e.stopPropagation()}
              autoFocus
            />
          ) : (
            <>
              <p className="truncate text-sm font-medium text-brand-secondary">
                {project.title}
              </p>
              <p className="text-xs text-brand-muted">
                {relativeTime(project.updatedAt)}
              </p>
            </>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            onClick={(e) => e.stopPropagation()}
          >
            <DropdownMenuItem
              onClick={() => setEditing(true)}
            >
              <Pencil className="mr-2 size-4" />
              სახელის შეცვლა
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDuplicate(project.id)}
            >
              <Copy className="mr-2 size-4" />
              დუბლიკატი
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-brand-danger focus:text-brand-danger"
              onClick={() => onDelete(project.id)}
            >
              <Trash2 className="mr-2 size-4" />
              წაშლა
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
