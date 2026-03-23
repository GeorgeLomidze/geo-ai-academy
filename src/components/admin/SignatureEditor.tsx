"use client";

import { useEffect, useState, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import Underline from "@tiptap/extension-underline";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link as LinkIcon,
  Minus,
  ImagePlus,
  Loader2,
  Save,
  Type as TypeIcon,
  Check,
  Baseline,
  Highlighter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { sanitizeSignatureLinkUrl } from "@/lib/email/signature-sanitizer";

const FONT_SIZES = [
  { label: "12px", value: "12px" },
  { label: "14px", value: "14px" },
  { label: "16px", value: "16px" },
  { label: "18px", value: "18px" },
];

const TEXT_COLORS = [
  { color: "#ffffff", label: "თეთრი" },
  { color: "#e0e0e0", label: "ღია ნაცრისფერი" },
  { color: "#888888", label: "ნაცრისფერი" },
  { color: "#333333", label: "მუქი ნაცრისფერი" },
  { color: "#000000", label: "შავი" },
  { color: "#FFD60A", label: "ოქროსფერი" },
  { color: "#FF4444", label: "წითელი" },
  { color: "#22C55E", label: "მწვანე" },
  { color: "#3B82F6", label: "ლურჯი" },
  { color: "#8B5CF6", label: "იისფერი" },
  { color: "#EC4899", label: "ვარდისფერი" },
  { color: "#FFD60A", label: "ყვითელი" },
];

const BG_COLORS = [
  { color: "", label: "გარეშე" },
  { color: "#FFD60A", label: "ოქროსფერი" },
  { color: "#FF4444", label: "წითელი" },
  { color: "#22C55E", label: "მწვანე" },
  { color: "#3B82F6", label: "ლურჯი" },
  { color: "#8B5CF6", label: "იისფერი" },
  { color: "#FFD60A", label: "ყვითელი" },
  { color: "#1a1a1a", label: "მუქი" },
  { color: "#333333", label: "ნაცრისფერი" },
  { color: "#ffffff", label: "თეთრი" },
  { color: "#FEF3C7", label: "ღია ყვითელი" },
  { color: "#DCFCE7", label: "ღია მწვანე" },
];

const FontSize = TextStyle.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      fontSize: {
        default: null,
        parseHTML: (element: HTMLElement) =>
          element.style.fontSize || null,
        renderHTML: (attributes: Record<string, unknown>) => {
          if (!attributes.fontSize) return {};
          return { style: `font-size: ${attributes.fontSize as string}` };
        },
      },
    };
  },
});

type SignatureEditorProps = {
  onSaved?: (html: string) => void;
};

export function SignatureEditor({ onSaved }: SignatureEditorProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [colorPanel, setColorPanel] = useState<"text" | "bg" | null>(null);
  const [showFontSize, setShowFontSize] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");
  const [imageDimensions, setImageDimensions] = useState<{
    width: string;
    height: string;
    node: HTMLImageElement | null;
  }>({ width: "", height: "", node: null });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const colorRef = useRef<HTMLDivElement>(null);
  const fontSizeRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        blockquote: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
      }),
      FontSize,
      Color,
      Highlight.configure({ multicolor: true }),
      Underline,
      Image.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: {
          style: "max-width: 300px; height: auto;",
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          style: "color: #FFD60A; text-decoration: underline;",
        },
      }),
      TextAlign.configure({
        types: ["paragraph"],
      }),
    ],
    editorProps: {
      attributes: {
        class:
          "tiptap-editor min-h-[120px] max-h-[300px] overflow-y-auto rounded-b-xl border border-t-0 border-brand-border bg-brand-background p-4 text-sm text-brand-secondary outline-none",
      },
      handleClick: (_view, _pos, event) => {
        const target = event.target as HTMLElement;
        if (target.tagName === "IMG") {
          const img = target as HTMLImageElement;
          setImageDimensions({
            width: String(img.width || img.naturalWidth),
            height: String(img.height || img.naturalHeight),
            node: img,
          });
        } else {
          setImageDimensions({ width: "", height: "", node: null });
        }
        return false;
      },
    },
    content: "",
  });

  useEffect(() => {
    async function fetchSignature() {
      try {
        const res = await fetch("/api/admin/signature", { credentials: "include" });
        if (res.ok) {
          const data = (await res.json()) as { html: string };
          editor?.commands.setContent(data.html || "");
        }
      } catch {
        // Empty editor on error
      } finally {
        setLoading(false);
      }
    }

    if (editor) {
      void fetchSignature();
    }
  }, [editor]);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (colorRef.current && !colorRef.current.contains(e.target as Node)) {
        setColorPanel(null);
      }
      if (fontSizeRef.current && !fontSizeRef.current.contains(e.target as Node)) {
        setShowFontSize(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleSave() {
    if (!editor) return;
    setSaving(true);
    setSaved(false);

    try {
      const html = editor.getHTML();
      const res = await fetch("/api/admin/signature", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ html }),
      });

      if (res.ok) {
        const data = (await res.json()) as { html?: string };
        if (data.html) {
          editor.commands.setContent(data.html);
          onSaved?.(data.html);
        }
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        const errBody = await res.text().catch(() => "");
        console.error("[SignatureEditor] Save failed:", res.status, errBody);
      }
    } catch (err) {
      console.error("[SignatureEditor] Save error:", err);
    } finally {
      setSaving(false);
    }
  }

  async function handleImageUpload(file: File) {
    if (!editor) return;
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/upload-image", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as { error?: string } | null;
        console.error("[SignatureEditor] Upload failed:", err);
        return;
      }

      const data = (await res.json()) as { url: string };

      editor
        .chain()
        .focus()
        .setImage({ src: data.url })
        .run();
    } catch (err) {
      console.error("[SignatureEditor] Upload error:", err);
    } finally {
      setUploading(false);
    }
  }

  function handleInsertLink() {
    if (!editor || !linkUrl.trim()) return;
    const safeUrl = sanitizeSignatureLinkUrl(linkUrl);

    if (!safeUrl) {
      console.error("[SignatureEditor] Unsafe link blocked");
      setShowLinkInput(false);
      setLinkUrl("");
      setLinkText("");
      return;
    }

    if (linkText.trim()) {
      editor
        .chain()
        .focus()
        .insertContent(
          `<a href="${safeUrl}" style="color: #FFD60A; text-decoration: underline;">${linkText}</a>`
        )
        .run();
    } else {
      editor.chain().focus().setLink({ href: safeUrl }).run();
    }

    setLinkUrl("");
    setLinkText("");
    setShowLinkInput(false);
  }

  function handleImageResize() {
    if (!imageDimensions.node) return;
    const w = Number.parseInt(imageDimensions.width, 10);
    const h = Number.parseInt(imageDimensions.height, 10);
    if (w > 0) imageDimensions.node.style.width = `${Math.min(w, 300)}px`;
    if (h > 0) imageDimensions.node.style.height = `${h}px`;
    if (editor) {
      const newHtml = editor.getHTML();
      editor.commands.setContent(newHtml);
    }
    setImageDimensions({ width: "", height: "", node: null });
  }

  function closeAllDropdowns() {
    setColorPanel(null);
    setShowFontSize(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-brand-border bg-brand-surface p-12">
        <Loader2 className="size-5 animate-spin text-brand-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-brand-border bg-brand-surface">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-1 rounded-t-2xl border-b border-brand-border bg-brand-surface-light px-3 py-2">
          <ToolbarButton
            active={editor?.isActive("bold")}
            onClick={() => editor?.chain().focus().toggleBold().run()}
            title="Bold"
          >
            <Bold className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            active={editor?.isActive("italic")}
            onClick={() => editor?.chain().focus().toggleItalic().run()}
            title="Italic"
          >
            <Italic className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            active={editor?.isActive("underline")}
            onClick={() => editor?.chain().focus().toggleUnderline().run()}
            title="Underline"
          >
            <UnderlineIcon className="size-4" />
          </ToolbarButton>

          <div className="mx-1 h-5 w-px bg-brand-border" />

          {/* Text color + Background color */}
          <div className="relative" ref={colorRef}>
            <div className="flex gap-0.5">
              <ToolbarButton
                onClick={() => {
                  setColorPanel(colorPanel === "text" ? null : "text");
                  setShowFontSize(false);
                }}
                active={colorPanel === "text"}
                title="ტექსტის ფერი"
              >
                <Baseline className="size-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => {
                  setColorPanel(colorPanel === "bg" ? null : "bg");
                  setShowFontSize(false);
                }}
                active={colorPanel === "bg"}
                title="ფონის ფერი"
              >
                <Highlighter className="size-4" />
              </ToolbarButton>
            </div>

            {colorPanel && (
              <div className="absolute top-full left-0 z-20 mt-1 w-52 rounded-xl border border-brand-border bg-brand-surface p-3 shadow-xl">
                <p className="mb-2 text-xs font-medium text-brand-muted">
                  {colorPanel === "text" ? "ტექსტის ფერი" : "ფონის ფერი"}
                </p>
                <div className="grid grid-cols-6 gap-1.5">
                  {(colorPanel === "text" ? TEXT_COLORS : BG_COLORS).map(
                    (item) => (
                      <button
                        key={item.color || "none"}
                        title={item.label}
                        className="flex size-7 items-center justify-center rounded-md border border-brand-border transition-transform hover:scale-110"
                        style={{
                          backgroundColor: item.color || "transparent",
                        }}
                        onClick={() => {
                          if (colorPanel === "text") {
                            editor?.chain().focus().setColor(item.color).run();
                          } else if (item.color) {
                            editor
                              ?.chain()
                              .focus()
                              .setHighlight({ color: item.color })
                              .run();
                          } else {
                            editor?.chain().focus().unsetHighlight().run();
                          }
                          setColorPanel(null);
                        }}
                      >
                        {!item.color && (
                          <Minus className="size-3 text-brand-muted" />
                        )}
                      </button>
                    )
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Font size */}
          <div className="relative" ref={fontSizeRef}>
            <ToolbarButton
              onClick={() => {
                setShowFontSize(!showFontSize);
                setColorPanel(null);
              }}
              title="ზომა"
            >
              <TypeIcon className="size-4" />
            </ToolbarButton>
            {showFontSize && (
              <div className="absolute top-full left-0 z-20 mt-1 rounded-xl border border-brand-border bg-brand-surface p-1 shadow-xl">
                {FONT_SIZES.map((size) => (
                  <button
                    key={size.value}
                    className="block w-full rounded-lg px-4 py-1.5 text-left text-xs text-brand-secondary hover:bg-white/5"
                    onClick={() => {
                      editor
                        ?.chain()
                        .focus()
                        .setMark("textStyle", { fontSize: size.value })
                        .run();
                      setShowFontSize(false);
                    }}
                  >
                    {size.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="mx-1 h-5 w-px bg-brand-border" />

          <ToolbarButton
            active={editor?.isActive({ textAlign: "left" })}
            onClick={() => {
              closeAllDropdowns();
              editor?.chain().focus().setTextAlign("left").run();
            }}
            title="მარცხნივ"
          >
            <AlignLeft className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            active={editor?.isActive({ textAlign: "center" })}
            onClick={() => {
              closeAllDropdowns();
              editor?.chain().focus().setTextAlign("center").run();
            }}
            title="ცენტრში"
          >
            <AlignCenter className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            active={editor?.isActive({ textAlign: "right" })}
            onClick={() => {
              closeAllDropdowns();
              editor?.chain().focus().setTextAlign("right").run();
            }}
            title="მარჯვნივ"
          >
            <AlignRight className="size-4" />
          </ToolbarButton>

          <div className="mx-1 h-5 w-px bg-brand-border" />

          <ToolbarButton
            onClick={() => {
              closeAllDropdowns();
              setShowLinkInput(!showLinkInput);
            }}
            active={editor?.isActive("link")}
            title="ბმული"
          >
            <LinkIcon className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => {
              closeAllDropdowns();
              editor?.chain().focus().setHorizontalRule().run();
            }}
            title="გამყოფი ხაზი"
          >
            <Minus className="size-4" />
          </ToolbarButton>

          <div className="mx-1 h-5 w-px bg-brand-border" />

          <ToolbarButton
            onClick={() => {
              closeAllDropdowns();
              fileInputRef.current?.click();
            }}
            disabled={uploading}
            title="სურათის ატვირთვა"
          >
            {uploading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <ImagePlus className="size-4" />
            )}
          </ToolbarButton>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleImageUpload(file);
              e.target.value = "";
            }}
          />
        </div>

        {/* Link insertion */}
        {showLinkInput && (
          <div className="flex items-center gap-2 border-b border-brand-border bg-brand-surface-light px-3 py-2">
            <input
              type="text"
              placeholder="ტექსტი"
              value={linkText}
              onChange={(e) => setLinkText(e.target.value)}
              className="h-8 w-32 rounded-lg border border-brand-border bg-brand-background px-2 text-xs text-brand-secondary outline-none focus:border-brand-primary"
            />
            <input
              type="url"
              placeholder="https://..."
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              className="h-8 flex-1 rounded-lg border border-brand-border bg-brand-background px-2 text-xs text-brand-secondary outline-none focus:border-brand-primary"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleInsertLink();
              }}
            />
            <button
              onClick={handleInsertLink}
              className="flex size-8 items-center justify-center rounded-lg bg-brand-primary text-brand-background transition-colors hover:bg-brand-primary-hover"
            >
              <Check className="size-3.5" />
            </button>
          </div>
        )}

        {/* Image resize controls */}
        {imageDimensions.node && (
          <div className="flex items-center gap-2 border-b border-brand-border bg-brand-surface-light px-3 py-2">
            <span className="text-xs text-brand-muted">სიგანე:</span>
            <input
              type="number"
              value={imageDimensions.width}
              onChange={(e) =>
                setImageDimensions((d) => ({ ...d, width: e.target.value }))
              }
              className="h-7 w-16 rounded-lg border border-brand-border bg-brand-background px-2 text-xs text-brand-secondary outline-none focus:border-brand-primary"
              max={300}
            />
            <span className="text-xs text-brand-muted">სიმაღლე:</span>
            <input
              type="number"
              value={imageDimensions.height}
              onChange={(e) =>
                setImageDimensions((d) => ({ ...d, height: e.target.value }))
              }
              className="h-7 w-16 rounded-lg border border-brand-border bg-brand-background px-2 text-xs text-brand-secondary outline-none focus:border-brand-primary"
            />
            <span className="text-xs text-brand-muted">px</span>
            <button
              onClick={handleImageResize}
              className="flex h-7 items-center gap-1 rounded-lg bg-brand-primary px-3 text-xs font-medium text-brand-background transition-colors hover:bg-brand-primary-hover"
            >
              <Check className="size-3" />
            </button>
            <button
              onClick={() =>
                setImageDimensions({ width: "", height: "", node: null })
              }
              className="text-xs text-brand-muted hover:text-brand-secondary"
            >
              დახურვა
            </button>
          </div>
        )}

        {/* Editor */}
        <EditorContent editor={editor} />
      </div>

      {/* Preview */}
      {editor && editor.getHTML() !== "<p></p>" && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-brand-muted">გადახედვა</p>
          <div
            className="rounded-xl border border-brand-border bg-[#0a0a0a] p-4"
            style={{ maxWidth: 560 }}
          >
            <hr
              style={{
                border: "none",
                borderTop: "1px solid #333",
                margin: "0 0 16px",
              }}
            />
            <div
              className="text-sm text-[#e0e0e0]"
              dangerouslySetInnerHTML={{ __html: editor.getHTML() }}
            />
          </div>
        </div>
      )}

      {/* Save */}
      <div className="flex items-center gap-3">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="h-10 rounded-xl text-sm font-semibold"
        >
          {saving ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          შენახვა
        </Button>
        {saved && (
          <span className="flex items-center gap-1.5 text-sm text-brand-success">
            <Check className="size-4" />
            შენახულია
          </span>
        )}
      </div>
    </div>
  );
}

function ToolbarButton({
  children,
  active,
  disabled,
  onClick,
  title,
}: {
  children: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`flex size-8 items-center justify-center rounded-lg transition-colors ${
        active
          ? "bg-brand-primary/20 text-brand-primary"
          : "text-brand-muted hover:bg-white/5 hover:text-brand-secondary"
      } ${disabled ? "pointer-events-none opacity-50" : ""}`}
    >
      {children}
    </button>
  );
}
