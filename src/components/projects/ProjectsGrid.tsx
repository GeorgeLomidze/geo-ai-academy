"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProjectCard } from "./ProjectCard";
import type { ProjectSummary } from "./types";

interface ProjectsGridProps {
  initialProjects: ProjectSummary[];
}

export function ProjectsGrid({ initialProjects }: ProjectsGridProps) {
  const router = useRouter();
  const [projects, setProjects] = useState(initialProjects);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [creating, setCreating] = useState(false);

  const filtered = search.trim()
    ? projects.filter((p) =>
        p.title.toLowerCase().includes(search.toLowerCase())
      )
    : projects;

  async function handleCreate() {
    if (creating) return;
    setCreating(true);
    try {
      const res = await fetch("/api/projects", { method: "POST" });
      if (!res.ok) return;
      const data = (await res.json()) as { id: string };
      router.push(`/ai-tools/projects/${data.id}`);
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    await fetch(`/api/projects/${id}`, { method: "DELETE" });
  }

  async function handleDuplicate(id: string) {
    const project = projects.find((p) => p.id === id);
    if (!project) return;

    const res = await fetch("/api/projects", { method: "POST" });
    if (!res.ok) return;
    const created = (await res.json()) as { id: string; title: string };

    const original = await fetch(`/api/projects/${id}`);
    if (!original.ok) return;
    const originalData = (await original.json()) as {
      nodes: unknown[];
    };

    await fetch(`/api/projects/${created.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: `${project.title} (ასლი)`,
        nodes: originalData.nodes,
      }),
    });

    setProjects((prev) => [
      {
        id: created.id,
        title: `${project.title} (ასლი)`,
        thumbnail: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      ...prev,
    ]);
  }

  async function handleRename(id: string, title: string) {
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, title } : p))
    );
    await fetch(`/api/projects/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-brand-secondary">პროექტები</h1>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-brand-muted" />
            <input
              type="text"
              placeholder="ძიება..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 rounded-full border border-brand-border bg-brand-background pl-9 pr-4 text-sm text-brand-secondary placeholder:text-brand-muted focus:border-brand-accent focus:outline-none"
            />
          </div>

          <div className="flex rounded-full border border-brand-border">
            <button
              className={`rounded-l-full px-2.5 py-1.5 ${viewMode === "grid" ? "bg-brand-accent/10 text-brand-accent" : "text-brand-muted"}`}
              onClick={() => setViewMode("grid")}
            >
              <LayoutGrid className="size-4" />
            </button>
            <button
              className={`rounded-r-full px-2.5 py-1.5 ${viewMode === "list" ? "bg-brand-accent/10 text-brand-accent" : "text-brand-muted"}`}
              onClick={() => setViewMode("list")}
            >
              <List className="size-4" />
            </button>
          </div>

          <Button
            className="rounded-full bg-brand-accent text-black hover:bg-brand-accent-hover"
            onClick={() => void handleCreate()}
            disabled={creating}
          >
            <Plus className="mr-1.5 size-4" />
            ახალი პროექტი
          </Button>
        </div>
      </div>

      {viewMode === "grid" ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onDelete={(id) => void handleDelete(id)}
              onDuplicate={(id) => void handleDuplicate(id)}
              onRename={(id, title) => void handleRename(id, title)}
            />
          ))}
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-2">
          {filtered.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onDelete={(id) => void handleDelete(id)}
              onDuplicate={(id) => void handleDuplicate(id)}
              onRename={(id, title) => void handleRename(id, title)}
            />
          ))}
        </div>
      )}

      {filtered.length === 0 && (
        <div className="mt-16 flex flex-col items-center text-center">
          <p className="text-brand-muted">
            {search.trim()
              ? "პროექტი ვერ მოიძებნა"
              : "ჯერ არ გაქვს პროექტები"}
          </p>
          {!search.trim() && (
            <Button
              className="mt-4 rounded-full bg-brand-accent text-black hover:bg-brand-accent-hover"
              onClick={() => void handleCreate()}
              disabled={creating}
            >
              <Plus className="mr-1.5 size-4" />
              პირველი პროექტის შექმნა
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
