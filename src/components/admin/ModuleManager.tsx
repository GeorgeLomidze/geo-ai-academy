"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Plus,
  GripVertical,
  Trash2,
  ChevronDown,
  ChevronRight,
  Film,
  FileText,
  Loader2,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LessonForm } from "./LessonForm";

type Lesson = {
  id: string;
  title: string;
  type: "VIDEO" | "TEXT";
  content: string | null;
  bunnyVideoId: string | null;
  duration: number;
  isFree: boolean;
  sortOrder: number;
};

type Module = {
  id: string;
  title: string;
  sortOrder: number;
  lessons: Lesson[];
};

export function ModuleManager({
  courseId,
  initialModules,
}: {
  courseId: string;
  initialModules: Module[];
}) {
  const router = useRouter();
  const [modules, setModules] = useState(initialModules);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(
    new Set(initialModules.map((m) => m.id))
  );
  const [addingModule, setAddingModule] = useState(false);
  const [newModuleTitle, setNewModuleTitle] = useState("");
  const [savingModule, setSavingModule] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function toggleModule(id: string) {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleAddModule() {
    if (!newModuleTitle.trim()) return;
    setSavingModule(true);

    try {
      const res = await fetch("/api/admin/modules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newModuleTitle, courseId }),
      });

      if (res.ok) {
        const mod = await res.json();
        setModules((prev) => [...prev, { ...mod, lessons: [] }]);
        setExpandedModules((prev) => new Set([...prev, mod.id]));
        setNewModuleTitle("");
        setAddingModule(false);
      }
    } finally {
      setSavingModule(false);
    }
  }

  async function handleDeleteModule(moduleId: string) {
    const res = await fetch("/api/admin/modules", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: moduleId }),
    });

    if (res.ok) {
      setModules((prev) => prev.filter((m) => m.id !== moduleId));
    }
  }

  async function handleModuleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = modules.findIndex((m) => m.id === active.id);
    const newIndex = modules.findIndex((m) => m.id === over.id);
    const reordered = arrayMove(modules, oldIndex, newIndex);
    setModules(reordered);

    // Persist reorder
    await fetch("/api/admin/modules", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        modules: reordered.map((m, i) => ({ id: m.id, sortOrder: i })),
      }),
    });
  }

  function handleLessonAdded(moduleId: string, lesson: Lesson) {
    setModules((prev) =>
      prev.map((m) =>
        m.id === moduleId ? { ...m, lessons: [...m.lessons, lesson] } : m
      )
    );
  }

  function handleLessonUpdated(moduleId: string, lesson: Lesson) {
    setModules((prev) =>
      prev.map((m) =>
        m.id === moduleId
          ? {
              ...m,
              lessons: m.lessons.map((l) =>
                l.id === lesson.id ? lesson : l
              ),
            }
          : m
      )
    );
  }

  function handleLessonDeleted(moduleId: string, lessonId: string) {
    setModules((prev) =>
      prev.map((m) =>
        m.id === moduleId
          ? { ...m, lessons: m.lessons.filter((l) => l.id !== lessonId) }
          : m
      )
    );
  }

  return (
    <div className="space-y-4">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleModuleDragEnd}
      >
        <SortableContext
          items={modules.map((m) => m.id)}
          strategy={verticalListSortingStrategy}
        >
          {modules.map((mod, index) => (
            <SortableModule
              key={mod.id}
              module={mod}
              index={index}
              isExpanded={expandedModules.has(mod.id)}
              onToggle={() => toggleModule(mod.id)}
              onDelete={() => handleDeleteModule(mod.id)}
              onLessonAdded={(lesson) => handleLessonAdded(mod.id, lesson)}
              onLessonUpdated={(lesson) =>
                handleLessonUpdated(mod.id, lesson)
              }
              onLessonDeleted={(lessonId) =>
                handleLessonDeleted(mod.id, lessonId)
              }
            />
          ))}
        </SortableContext>
      </DndContext>

      {modules.length === 0 && !addingModule && (
        <div className="flex flex-col items-center rounded-2xl border-2 border-dashed border-brand-border py-12 text-center">
          <p className="text-sm text-brand-muted">
            მოდულები ჯერ არ არის დამატებული
          </p>
        </div>
      )}

      {/* Add module */}
      {addingModule ? (
        <div className="flex items-center gap-3 rounded-2xl border border-brand-border bg-brand-surface p-4">
          <Input
            value={newModuleTitle}
            onChange={(e) => setNewModuleTitle(e.target.value)}
            placeholder="მოდულის სახელი"
            className="rounded-xl"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAddModule();
              if (e.key === "Escape") setAddingModule(false);
            }}
          />
          <Button
            onClick={handleAddModule}
            className="shrink-0 rounded-xl"
            disabled={savingModule || !newModuleTitle.trim()}
          >
            {savingModule ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              "დამატება"
            )}
          </Button>
          <Button
            variant="ghost"
            onClick={() => setAddingModule(false)}
            className="shrink-0 rounded-xl"
          >
            გაუქმება
          </Button>
        </div>
      ) : (
        <Button
          variant="outline"
          onClick={() => setAddingModule(true)}
          className="w-full rounded-xl gap-2 border-dashed"
        >
          <Plus className="size-4" />
          მოდულის დამატება
        </Button>
      )}
    </div>
  );
}

function SortableModule({
  module: mod,
  index,
  isExpanded,
  onToggle,
  onDelete,
  onLessonAdded,
  onLessonUpdated,
  onLessonDeleted,
}: {
  module: Module;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onLessonAdded: (lesson: Lesson) => void;
  onLessonUpdated: (lesson: Lesson) => void;
  onLessonDeleted: (lessonId: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: mod.id });

  const [showLessonForm, setShowLessonForm] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  async function handleDeleteLesson(lessonId: string) {
    const res = await fetch("/api/admin/lessons", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: lessonId }),
    });

    if (res.ok) {
      onLessonDeleted(lessonId);
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="rounded-2xl border border-brand-border bg-brand-surface"
    >
      {/* Module header */}
      <div className="flex items-center gap-3 p-4">
        <button
          type="button"
          className="cursor-grab touch-none text-brand-muted hover:text-brand-secondary"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-5" />
        </button>

        <button
          type="button"
          onClick={onToggle}
          className="text-brand-muted hover:text-brand-secondary"
        >
          {isExpanded ? (
            <ChevronDown className="size-5" />
          ) : (
            <ChevronRight className="size-5" />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <h3 className="font-medium text-brand-secondary">
            <span className="text-brand-muted">მოდული {index + 1}:</span>{" "}
            {mod.title}
          </h3>
          <p className="text-xs text-brand-muted">
            {mod.lessons.length} გაკვეთილი
          </p>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          className="size-8 shrink-0 rounded-lg p-0 text-brand-danger hover:bg-brand-danger/10"
        >
          <Trash2 className="size-4" />
          <span className="sr-only">წაშლა</span>
        </Button>
      </div>

      {/* Lessons */}
      {isExpanded && (
        <div className="border-t border-brand-border">
          {mod.lessons.length > 0 && (
            <ul className="divide-y divide-brand-border">
              {mod.lessons.map((lesson) => (
                <li
                  key={lesson.id}
                  className="flex items-center gap-3 px-4 py-3 pl-14"
                >
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-brand-primary-light">
                    {lesson.type === "VIDEO" ? (
                      <Film className="size-3.5 text-brand-primary" />
                    ) : (
                      <FileText className="size-3.5 text-brand-primary" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-brand-secondary">
                      {lesson.title}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-brand-muted">
                        {lesson.type === "VIDEO" ? "ვიდეო" : "ტექსტი"}
                      </span>
                      {lesson.isFree && (
                        <span className="inline-flex items-center gap-0.5 text-xs text-brand-success">
                          <Eye className="size-3" />
                          უფასო
                        </span>
                      )}
                      {lesson.type === "VIDEO" && lesson.duration > 0 && (
                        <span className="text-xs text-brand-muted">
                          {Math.floor(lesson.duration / 60)} წთ
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 rounded-lg px-2 text-xs"
                      onClick={() => setEditingLesson(lesson)}
                    >
                      რედაქტირება
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="size-7 rounded-lg p-0 text-brand-danger hover:bg-brand-danger/10"
                      onClick={() => handleDeleteLesson(lesson.id)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* Lesson form (add or edit) */}
          {(showLessonForm || editingLesson) && (
            <div className="border-t border-brand-border p-4 pl-14">
              <LessonForm
                moduleId={mod.id}
                lesson={editingLesson ?? undefined}
                onSaved={(lesson) => {
                  if (editingLesson) {
                    onLessonUpdated(lesson);
                    setEditingLesson(null);
                  } else {
                    onLessonAdded(lesson);
                    setShowLessonForm(false);
                  }
                }}
                onCancel={() => {
                  setShowLessonForm(false);
                  setEditingLesson(null);
                }}
              />
            </div>
          )}

          {!showLessonForm && !editingLesson && (
            <div className="border-t border-brand-border p-3 pl-14">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowLessonForm(true)}
                className="gap-1.5 rounded-lg text-brand-primary hover:bg-brand-primary-light"
              >
                <Plus className="size-3.5" />
                გაკვეთილის დამატება
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
