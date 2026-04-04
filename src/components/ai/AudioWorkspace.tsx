"use client";

import type { CSSProperties, ReactNode, RefObject } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Check,
  ChevronDown,
  Copy,
  FileAudio,
  Loader2,
  MessageCircleMore,
  Music2,
  Pause,
  Play,
  Trash2,
  Upload,
  Volume2,
  Waves,
} from "lucide-react";
import { AudioPlayer } from "@/components/ai/AudioPlayer";
import { ClientDateText } from "@/components/ai/ClientDateText";
import type { AIHistoryItem } from "@/components/ai/types";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { AUDIO_MODELS } from "@/lib/credits/pricing";
import {
  AUDIO_DIALOGUE_MODEL_ID,
  AUDIO_TTS_MODEL_ID,
  GEMINI_VOICE_OPTIONS,
  type GeminiVoiceOption,
} from "@/lib/google/tts";
import { cn } from "@/lib/utils";

type AudioWorkspaceProps = {
  initialBalance: number;
  initialHistory: AIHistoryItem[];
};

type ToolKey = "tts" | "dialogue" | "sfx" | "isolation" | "transcription";

type DialogueSegment = {
  id: string;
  text: string;
  speakerId: string;
};

type DialogueSpeaker = {
  id: string;
  name: string;
  voice: GeminiVoiceOption["id"];
  toneClassName: string;
  dotClassName: string;
};

type TranscriptSegment = {
  speaker: string | null;
  text: string;
};

type LocalAudioFile = {
  file: File;
  previewUrl: string;
};

type AudioOutputData = {
  inlineAudioData?: string | null;
};

type VoicePreviewResponse = {
  audioUrl?: string;
};

const TOOL_ITEMS: Array<{
  key: ToolKey;
  title: string;
  icon: LucideIcon;
  cost: number;
}> = [
  {
    key: "tts",
    title: "წაკითხვა",
    icon: Volume2,
    cost: 3,
  },
  {
    key: "dialogue",
    title: "დიალოგი",
    icon: MessageCircleMore,
    cost: 4,
  },
  {
    key: "sfx",
    title: "ხმოვანი ეფექტები",
    icon: Music2,
    cost: 8,
  },
  {
    key: "isolation",
    title: "ხმის იზოლაცია",
    icon: Waves,
    cost: 9,
  },
  {
    key: "transcription",
    title: "ტრანსკრიფცია",
    icon: FileAudio,
    cost: 12,
  },
];

const SOUND_EFFECT_FORMATS = [
  { value: "mp3_44100_128", label: "MP3 44100Hz 128kbps" },
  { value: "mp3_44100_192", label: "MP3 44100Hz 192kbps" },
  { value: "pcm_44100", label: "PCM 44100Hz" },
];

const LANGUAGE_OPTIONS = [
  { value: "auto", label: "ავტომატურად" },
  { value: "ka", label: "ქართული" },
  { value: "en", label: "ინგლისური" },
  { value: "ru", label: "რუსული" },
  { value: "tr", label: "თურქული" },
  { value: "de", label: "გერმანული" },
  { value: "fr", label: "ფრანგული" },
  { value: "es", label: "ესპანური" },
];

const audioDatePartsFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "Asia/Tbilisi",
  month: "numeric",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

const GEORGIAN_MONTH_LABELS = [
  "იან",
  "თებ",
  "მარ",
  "აპრ",
  "მაი",
  "ივნ",
  "ივლ",
  "აგვ",
  "სექ",
  "ოქტ",
  "ნოე",
  "დეკ",
] as const;

function getToolConfig(tool: ToolKey) {
  return TOOL_ITEMS.find((item) => item.key === tool) ?? TOOL_ITEMS[0];
}

function getToolByModel(modelId: string): ToolKey {
  switch (modelId) {
    case "audio_dialogue_flash":
    case "audio_dialogue_pro":
    case "audio_dialogue":
      return "dialogue";
    case "audio_sfx":
      return "sfx";
    case "audio_isolation":
      return "isolation";
    case "audio_transcription":
      return "transcription";
    default:
      return "tts";
  }
}

function formatDate(value: string) {
  const parts = Object.fromEntries(
    audioDatePartsFormatter
      .formatToParts(new Date(value))
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value])
  );

  const monthNumber = Number(parts.month);
  const monthLabel =
    Number.isFinite(monthNumber) && monthNumber >= 1 && monthNumber <= 12
      ? GEORGIAN_MONTH_LABELS[monthNumber - 1]
      : parts.month;

  return `${parts.day} ${monthLabel}, ${parts.hour}:${parts.minute}`;
}

function getToolFailureMessage(tool: ToolKey) {
  switch (tool) {
    case "transcription":
      return "სამწუხაროდ ტრანსკრიფცია ვერ მოხერხდა. სცადეთ თავიდან";
    case "isolation":
      return "სამწუხაროდ ხმის იზოლაცია ვერ მოხერხდა. სცადეთ თავიდან";
    default:
      return "სამწუხაროდ გენერაცია ვერ მოხერხდა. სცადეთ თავიდან";
  }
}

function getSafeClientErrorMessage(
  message: string | null | undefined,
  fallbackMessage: string
) {
  if (!message) {
    return fallbackMessage;
  }

  const normalized = message.toLowerCase();

  if (
    normalized.includes("prisma") ||
    normalized.includes("invocation") ||
    normalized.includes("stack") ||
    normalized.includes("trace") ||
    normalized.includes("typeerror") ||
    normalized.includes("syntaxerror") ||
    normalized.includes("at ") ||
    normalized.includes("expected generationtype") ||
    normalized.includes("invalid value for argument") ||
    normalized.includes("invalid ") ||
    normalized.includes("documentation") ||
    normalized.includes("supported language") ||
    normalized.includes("server exception") ||
    normalized.includes("no message available") ||
    normalized.includes("please try again later") ||
    normalized.includes("kie.ai") ||
    normalized.includes("headers:") ||
    normalized.includes("body:") ||
    normalized.includes("status_code") ||
    normalized.includes("request_id") ||
    normalized.includes("access-control-allow") ||
    normalized.includes("content-type") ||
    normalized.includes("strict-transport-security") ||
    normalized.includes("language_code") ||
    normalized.includes("sound effect generation failed") ||
    normalized.includes("request_blocked_due_to_moderation") ||
    normalized.includes("authorization_error") ||
    (message.length > 180 &&
      (normalized.includes("{") ||
        normalized.includes("}") ||
        normalized.includes("[") ||
        normalized.includes("]"))) ||
    /^[\x00-\x7f\s.,:;!?'"\-_/()[\]]+$/.test(message)
  ) {
    return fallbackMessage;
  }

  return message;
}

function getResolvedAudioUrl(
  outputUrl: string | null,
  outputData: unknown
) {
  if (outputUrl) {
    return outputUrl;
  }

  if (
    outputData &&
    typeof outputData === "object" &&
    "inlineAudioData" in outputData &&
    typeof (outputData as AudioOutputData).inlineAudioData === "string"
  ) {
    return (outputData as AudioOutputData).inlineAudioData ?? null;
  }

  return null;
}

function getTranscriptSegments(outputData: unknown): TranscriptSegment[] {
  if (!Array.isArray(outputData)) {
    return [];
  }

  return outputData.flatMap((item) => {
    if (!item || typeof item !== "object") {
      return [];
    }

    const text = "text" in item ? item.text : null;
    const speaker = "speaker" in item ? item.speaker : null;

    if (typeof text !== "string") {
      return [];
    }

    return [
      {
        text,
        speaker:
          typeof speaker === "string"
            ? formatTranscriptSpeakerLabel(speaker)
            : null,
      },
    ];
  });
}

function formatTranscriptSpeakerLabel(speaker: string) {
  const normalized = speaker.trim();

  if (!normalized) {
    return "";
  }

  const indexedMatch = normalized.match(/^(?:speaker|spk)[\s_-]*(\d+)$/i);
  if (indexedMatch) {
    return `სპიკერი ${Number(indexedMatch[1]) + 1}`;
  }

  const numberedMatch = normalized.match(/^speaker\s+(\d+)$/i);
  if (numberedMatch) {
    return `სპიკერი ${Number(numberedMatch[1]) + 1}`;
  }

  return normalized;
}

function getTranscriptText(item: AIHistoryItem) {
  const segments = getTranscriptSegments(item.outputData);

  if (segments.length > 0) {
    return segments
      .map((segment) =>
        segment.speaker ? `${segment.speaker}: ${segment.text}` : segment.text
      )
      .join("\n");
  }

  return item.outputText ?? "";
}

function getHistoryPreview(item: AIHistoryItem) {
  return item.prompt?.trim() || item.outputText?.trim() || "ფაილზე დაფუძნებული გენერაცია";
}

function getStatusLabel(status: AIHistoryItem["status"]) {
  if (status === "SUCCEEDED") {
    return "მზადაა";
  }

  if (status === "FAILED" || status === "CANCELED") {
    return "ვერ შესრულდა";
  }

  return "მუშავდება";
}

function getAudioDownloadName(tool: ToolKey) {
  return tool === "tts" || tool === "dialogue" ? `${tool}.wav` : `${tool}.mp3`;
}

function createDialogueSegment(id: string, speakerId = "speaker-1"): DialogueSegment {
  return {
    id,
    text: "",
    speakerId,
  };
}

function createDialogueSpeakers(): DialogueSpeaker[] {
  return [
    {
      id: "speaker-1",
      name: "სპიკერი 1",
      voice: "Zephyr",
      toneClassName: "border-brand-primary bg-brand-primary text-black",
      dotClassName: "bg-brand-primary",
    },
    {
      id: "speaker-2",
      name: "სპიკერი 2",
      voice: "Kore",
      toneClassName: "border-brand-primary bg-brand-primary text-black",
      dotClassName: "bg-brand-primary",
    },
  ];
}

function VoiceSelect({
  value,
  onValueChange,
  onPreview,
  previewLoadingKey,
  previewPlayingKey,
}: {
  value: GeminiVoiceOption["id"];
  onValueChange: (value: GeminiVoiceOption["id"]) => void;
  onPreview: (voice: GeminiVoiceOption["id"]) => void;
  previewLoadingKey: string | null;
  previewPlayingKey: string | null;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const selectedVoice =
    GEMINI_VOICE_OPTIONS.find((voice) => voice.id === value) ?? GEMINI_VOICE_OPTIONS[0];

  useEffect(() => {
    function handlePointerDown(event: MouseEvent | TouchEvent) {
      if (!(event.target instanceof Node)) {
        return;
      }

      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="flex h-12 w-full items-center justify-between gap-3 rounded-2xl border border-[#2A2A2A] bg-[#141414] px-3 text-left text-white transition-colors hover:border-[#3A3A3A]"
      >
        <span className="min-w-0 truncate">{selectedVoice.name}</span>
        <ChevronDown
          className={cn("size-4 shrink-0 text-[#8A8A8A] transition-transform", open && "rotate-180")}
        />
      </button>

      {open ? (
        <div className="absolute top-full left-0 z-50 mt-2 w-full overflow-hidden rounded-2xl border border-[#2A2A2A] bg-[#141414] shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
          <div className="h-80 overflow-y-auto overscroll-contain p-1.5">
            {GEMINI_VOICE_OPTIONS.map((voice) => {
              const previewKey = voice.id;
              const isLoading = previewLoadingKey === previewKey;
              const isPlaying = previewPlayingKey === previewKey;
              const isSelected = voice.id === value;

              return (
                <div
                  key={voice.id}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl border px-2 py-2 transition-colors",
                    isSelected
                      ? "border-brand-primary/40 bg-[#221c05] text-brand-primary"
                      : "border-transparent hover:bg-[#1E1E1E]"
                  )}
                >
                  <button
                    type="button"
                    aria-label={`${voice.name} ხმის მოსმენა`}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      onPreview(voice.id);
                    }}
                    className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-primary text-black shadow-[0_0_0_1px_rgba(255,214,10,0.2)] transition-colors hover:bg-brand-primary-hover"
                  >
                    {isLoading ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : isPlaying ? (
                      <Pause className="size-4" />
                    ) : (
                      <Play className="size-4 fill-current" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onValueChange(voice.id);
                      setOpen(false);
                    }}
                    className="min-w-0 flex-1 text-left"
                  >
                    <span className={cn("truncate", isSelected ? "text-brand-primary" : "text-white")}>
                      {voice.name}
                    </span>
                  </button>

                  {isSelected ? (
                    <Check className="size-4 shrink-0 text-brand-primary" />
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SliderField({
  label,
  min,
  max,
  step,
  value,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
}) {
  const fillPercent = ((value - min) / (max - min)) * 100;

  return (
    <label className="block">
      <div className="mb-2 flex items-center justify-between text-sm text-[#D1D1D1]">
        <span>{label}</span>
        <span className="tabular-nums text-brand-primary">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="audio-slider h-2 w-full cursor-pointer"
        style={
          {
            accentColor: "#FFD60A",
            "--range-fill": `${fillPercent}%`,
          } as CSSProperties
        }
      />
    </label>
  );
}

function Panel({
  title,
  children,
  footer,
}: {
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-[#2A2A2A] bg-[#1E1E1E] p-5 sm:p-6">
      <div className="mb-5">
        <h2 className="font-display text-xl text-white">{title}</h2>
      </div>

      {children}

      {footer ? <div className="mt-6 border-t border-[#2A2A2A] pt-4">{footer}</div> : null}
    </section>
  );
}

export function AudioWorkspace({
  initialBalance,
  initialHistory,
}: AudioWorkspaceProps) {
  const dialogueSegmentCounterRef = useRef(2);
  const [activeTool, setActiveTool] = useState<ToolKey>("tts");
  const [balance, setBalance] = useState(initialBalance);
  const [history, setHistory] = useState(initialHistory);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedHistoryId, setCopiedHistoryId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AIHistoryItem | null>(null);
  const [deletePending, setDeletePending] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [ttsStyleInstructions, setTtsStyleInstructions] = useState("");
  const [ttsText, setTtsText] = useState("");
  const [ttsVoice, setTtsVoice] = useState<GeminiVoiceOption["id"]>("Kore");
  const [ttsTemperature, setTtsTemperature] = useState(1);

  const [dialogueSegments, setDialogueSegments] = useState<DialogueSegment[]>([
    createDialogueSegment("segment-1", "speaker-1"),
    createDialogueSegment("segment-2", "speaker-2"),
  ]);
  const [dialogueSpeakers, setDialogueSpeakers] = useState<DialogueSpeaker[]>(
    createDialogueSpeakers()
  );
  const [dialogueStyleInstructions, setDialogueStyleInstructions] = useState("");
  const [dialogueTemperature, setDialogueTemperature] = useState(1);

  const [sfxText, setSfxText] = useState("");
  const [sfxLoop, setSfxLoop] = useState(false);
  const [sfxDuration, setSfxDuration] = useState(11.2);
  const [sfxInfluence, setSfxInfluence] = useState(0.3);
  const [sfxFormat, setSfxFormat] = useState("mp3_44100_128");

  const [isolationFile, setIsolationFile] = useState<LocalAudioFile | null>(null);
  const [transcriptionFile, setTranscriptionFile] = useState<LocalAudioFile | null>(null);
  const [transcriptionLanguage, setTranscriptionLanguage] = useState("auto");
  const [transcriptionTagEvents, setTranscriptionTagEvents] = useState(true);
  const [transcriptionDiarize, setTranscriptionDiarize] = useState(true);

  const [previewLoadingKey, setPreviewLoadingKey] = useState<string | null>(null);
  const [previewPlayingKey, setPreviewPlayingKey] = useState<string | null>(null);

  const isolationInputRef = useRef<HTMLInputElement | null>(null);
  const transcriptionInputRef = useRef<HTMLInputElement | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const previewCacheRef = useRef<Record<string, string>>({});

  const activeToolConfig = getToolConfig(activeTool);
  const activeToolCost =
    activeTool === "tts"
      ? AUDIO_MODELS[AUDIO_TTS_MODEL_ID].coins
      : activeTool === "dialogue"
        ? AUDIO_MODELS[AUDIO_DIALOGUE_MODEL_ID].coins
        : activeToolConfig.cost;
  const filteredHistory = useMemo(
    () => history.filter((item) => getToolByModel(item.modelId) === activeTool),
    [activeTool, history]
  );

  useEffect(() => {
    return () => {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current = null;
      }
    };
  }, []);

  function replaceLocalFile(
    current: LocalAudioFile | null,
    nextFile: File
  ): LocalAudioFile {
    if (current?.previewUrl) {
      URL.revokeObjectURL(current.previewUrl);
    }

    return {
      file: nextFile,
      previewUrl: URL.createObjectURL(nextFile),
    };
  }

  function clearLocalFile(fileState: LocalAudioFile | null) {
    if (fileState?.previewUrl) {
      URL.revokeObjectURL(fileState.previewUrl);
    }
  }

  function handleIsolationFile(nextFile: File | null) {
    if (!nextFile) return;
    setIsolationFile((current) => replaceLocalFile(current, nextFile));
  }

  function handleTranscriptionFile(nextFile: File | null) {
    if (!nextFile) return;
    setTranscriptionFile((current) => replaceLocalFile(current, nextFile));
  }

  function resetDialogue() {
    const speakers = createDialogueSpeakers();
    dialogueSegmentCounterRef.current = 2;
    setDialogueSpeakers(speakers);
    setDialogueSegments([
      createDialogueSegment("segment-1", speakers[0].id),
      createDialogueSegment("segment-2", speakers[1].id),
    ]);
    setDialogueStyleInstructions("");
    setDialogueTemperature(1);
  }

  function addDialogueSegment() {
    dialogueSegmentCounterRef.current += 1;
    setDialogueSegments((current) => [
      ...current,
      createDialogueSegment(
        `segment-${dialogueSegmentCounterRef.current}`,
        current.length % 2 === 0 ? "speaker-1" : "speaker-2"
      ),
    ]);
  }

  function updateDialogueSegment(
    id: string,
    key: "text" | "speakerId",
    value: string
  ) {
    setDialogueSegments((current) =>
      current.map((segment) =>
        segment.id === id ? { ...segment, [key]: value } : segment
      )
    );
  }

  function updateDialogueSpeaker(
    speakerId: string,
    key: "name" | "voice",
    value: string
  ) {
    setDialogueSpeakers((current) =>
      current.map((speaker) =>
        speaker.id === speakerId ? { ...speaker, [key]: value } : speaker
      )
    );
  }

  function removeDialogueSegment(id: string) {
    setDialogueSegments((current) =>
      current.length <= 1 ? current : current.filter((segment) => segment.id !== id)
    );
  }

  function getDialogueSpeaker(speakerId: string) {
    return (
      dialogueSpeakers.find((speaker) => speaker.id === speakerId) ?? dialogueSpeakers[0]
    );
  }

  async function runGeneration() {
    setSubmitting(true);
    setError(null);

    try {
      let response: Response;
      const tool = activeTool;

      if (tool === "tts") {
        response = await fetch("/api/ai/audio/tts", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: ttsText,
            styleInstructions: ttsStyleInstructions,
            voice: ttsVoice,
            temperature: ttsTemperature,
          }),
        });
      } else if (tool === "dialogue") {
        response = await fetch("/api/ai/audio/dialogue", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            styleInstructions: dialogueStyleInstructions,
            temperature: dialogueTemperature,
            segments: dialogueSegments.map((segment) => {
              const speaker = getDialogueSpeaker(segment.speakerId);
              return {
                speaker: speaker.name,
                text: segment.text,
                voice: speaker.voice,
              };
            }),
          }),
        });
      } else if (tool === "isolation" || tool === "transcription") {
        const formData = new FormData();
        formData.set(
          "payload",
          JSON.stringify({
            tool,
            params:
              tool === "transcription"
                ? {
                    language_code: transcriptionLanguage === "auto" ? "" : transcriptionLanguage,
                    tag_audio_events: transcriptionTagEvents,
                    diarize: transcriptionDiarize,
                  }
                : {},
          })
        );

        const sourceFile = tool === "isolation" ? isolationFile?.file : transcriptionFile?.file;
        if (!sourceFile) {
          throw new Error(
            tool === "isolation"
              ? "აუდიო ფაილი აუცილებელია"
              : "ტრანსკრიფციისთვის ფაილი აუცილებელია"
          );
        }

        formData.set("file", sourceFile);
        response = await fetch("/api/ai/audio/generate", {
          method: "POST",
          body: formData,
        });
      } else {
        const params = {
          text: sfxText,
          loop: sfxLoop,
          duration_seconds: sfxDuration,
          prompt_influence: sfxInfluence,
          output_format: sfxFormat,
        };

        response = await fetch("/api/ai/audio/generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            tool,
            params,
          }),
        });
      }

      const data = (await response.json()) as {
        error?: string;
        generationId?: string;
        status?: AIHistoryItem["status"];
        outputUrl?: string | null;
        outputText?: string | null;
        outputData?: TranscriptSegment[];
        creditsUsed?: number;
      };

      if (!response.ok || !data.generationId) {
        throw new Error(data.error ?? "აუდიო გენერაცია ვერ შესრულდა");
      }

      const historyItem: AIHistoryItem = {
        id: data.generationId,
        modelId:
          tool === "tts"
            ? AUDIO_TTS_MODEL_ID
            : tool === "dialogue"
              ? AUDIO_DIALOGUE_MODEL_ID
              : tool === "sfx"
                ? "audio_sfx"
                : tool === "isolation"
                  ? "audio_isolation"
                  : "audio_transcription",
        modelName:
          tool === "tts"
            ? AUDIO_MODELS[AUDIO_TTS_MODEL_ID].name
            : tool === "dialogue"
              ? AUDIO_MODELS[AUDIO_DIALOGUE_MODEL_ID].name
              : getToolConfig(tool).title,
        type: "AUDIO",
        prompt:
          tool === "tts"
            ? ttsText
            : tool === "dialogue"
              ? dialogueSegments
                  .map((segment) => {
                    const speaker = getDialogueSpeaker(segment.speakerId);
                    return `${speaker.name}: ${segment.text}`;
                  })
                  .join("\n")
              : tool === "sfx"
                ? sfxText
                : null,
        status: data.status ?? "SUCCEEDED",
        outputUrl: data.outputUrl ?? null,
        outputText: data.outputText ?? null,
        outputData: data.outputData ?? [],
        errorMessage: null,
        creditsUsed: data.creditsUsed ?? activeToolCost,
        createdAt: new Date().toISOString(),
        sourceUrl: null,
      };

      setBalance((current) => current - historyItem.creditsUsed);
      setHistory((current) => [historyItem, ...current]);
    } catch (generationError) {
      const fallbackMessage = getToolFailureMessage(activeTool);
      setError(
        getSafeClientErrorMessage(
          generationError instanceof Error
            ? generationError.message
            : fallbackMessage,
          fallbackMessage
        )
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function copyTranscript(item: AIHistoryItem) {
    const transcriptText = getTranscriptText(item);

    if (!transcriptText) {
      return;
    }

    await navigator.clipboard.writeText(transcriptText);
    setCopiedHistoryId(item.id);
    window.setTimeout(() => {
      setCopiedHistoryId((current) => (current === item.id ? null : current));
    }, 1800);
  }

  function downloadTranscript(item: AIHistoryItem) {
    const transcriptText = getTranscriptText(item);

    if (!transcriptText) {
      return;
    }

    if (item.outputUrl) {
      const link = document.createElement("a");
      link.href = item.outputUrl;
      link.download = "transcript.txt";
      document.body.append(link);
      link.click();
      link.remove();
      return;
    }

    const blob = new Blob([transcriptText], {
      type: "text/plain;charset=utf-8",
    });
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = "transcript.txt";
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(blobUrl), 1500);
  }

  async function deleteHistoryItem() {
    if (!deleteTarget) {
      return;
    }

    setDeletePending(true);
    setDeleteError(null);

    try {
      const response = await fetch(`/api/ai/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const isJson = response.headers.get("content-type")?.includes("application/json");
      const data = isJson ? ((await response.json()) as { error?: string }) : null;

      if (!response.ok) {
        setDeleteError(data?.error ?? "შედეგის წაშლა ვერ მოხერხდა");
        return;
      }

      setHistory((current) => current.filter((item) => item.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch {
      setDeleteError("კავშირის შეცდომა, სცადეთ თავიდან");
    } finally {
      setDeletePending(false);
    }
  }

  function stopVoicePreview() {
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current.currentTime = 0;
    }
    setPreviewPlayingKey(null);
  }

  async function playVoicePreview(
    voice: GeminiVoiceOption["id"]
  ) {
    const cacheKey = voice;
    const voiceOption =
      GEMINI_VOICE_OPTIONS.find((item) => item.id === voice) ?? GEMINI_VOICE_OPTIONS[0];

    if (previewPlayingKey === cacheKey) {
      stopVoicePreview();
      return;
    }

    setPreviewLoadingKey(cacheKey);
    setError(null);

    try {
      let audioUrl = previewCacheRef.current[cacheKey];

      if (!audioUrl) {
        const response = await fetch("/api/ai/audio/voice-preview", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            voice,
            name: voiceOption.name,
          }),
        });

        const data = (await response.json()) as VoicePreviewResponse & { error?: string };

        if (!response.ok || !data.audioUrl) {
          throw new Error(data.error ?? "ხმის მოსმენა დროებით ვერ მოხერხდა");
        }

        audioUrl = data.audioUrl;
        previewCacheRef.current[cacheKey] = audioUrl;
      }

      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
      }

      const audio = new Audio(audioUrl);
      audio.onended = () => setPreviewPlayingKey(null);
      audio.onerror = () => {
        setPreviewPlayingKey(null);
        setError("ხმის მოსმენა დროებით ვერ მოხერხდა");
      };
      previewAudioRef.current = audio;
      await audio.play();
      setPreviewPlayingKey(cacheKey);
    } catch (previewError) {
      const fallbackMessage = "ხმის მოსმენა დროებით ვერ მოხერხდა";
      setError(
        getSafeClientErrorMessage(
          previewError instanceof Error
            ? previewError.message
            : fallbackMessage,
          fallbackMessage
        )
      );
    } finally {
      setPreviewLoadingKey(null);
    }
  }

  function renderVoiceSelect(
    value: string,
    onValueChange: (value: string) => void
  ) {
    return (
      <VoiceSelect
        value={value as GeminiVoiceOption["id"]}
        onValueChange={(nextValue) => onValueChange(nextValue)}
        onPreview={(voice) => {
          void playVoicePreview(voice);
        }}
        previewLoadingKey={previewLoadingKey}
        previewPlayingKey={previewPlayingKey}
      />
    );
  }

  function renderUploadArea(options: {
    title: string;
    fileState: LocalAudioFile | null;
    inputRef: RefObject<HTMLInputElement | null>;
    onSelectFile: (file: File | null) => void;
    onClear: () => void;
  }) {
    return options.fileState ? (
      <div className="rounded-3xl border border-[#2A2A2A] bg-[#141414] p-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white">
              {options.fileState.file.name}
            </p>
            <p className="mt-1 text-xs text-[#8A8A8A]">
              {(options.fileState.file.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            className="rounded-full border-[#2A2A2A] bg-transparent text-white hover:border-brand-primary hover:bg-brand-primary hover:text-black"
            onClick={options.onClear}
          >
            <Trash2 className="size-4" />
            წაშლა
          </Button>
        </div>

        <AudioPlayer src={options.fileState.previewUrl} showDownload={false} />
      </div>
    ) : (
      <button
        type="button"
        onClick={() => options.inputRef.current?.click()}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          options.onSelectFile(event.dataTransfer.files?.[0] ?? null);
        }}
        className="flex min-h-56 w-full flex-col items-center justify-center rounded-3xl border border-dashed border-[#2A2A2A] bg-[#141414] px-6 text-center transition-colors hover:border-brand-primary hover:bg-brand-primary/12"
      >
        <div className="flex size-14 items-center justify-center rounded-full bg-brand-primary text-black">
          <Upload className="size-6" />
        </div>
        <p className="mt-5 text-lg text-white">{options.title}</p>
        <p className="mt-2 max-w-sm text-sm leading-6 text-[#8A8A8A]">
          გადმოათრიე ფაილი აქ ან დააჭირე ასარჩევად
        </p>

        <input
          ref={options.inputRef}
          type="file"
          accept=".mp3,.wav,.aac,.mp4,.ogg,.mpeg,.m4a,audio/*"
          className="hidden"
          onChange={(event) => options.onSelectFile(event.target.files?.[0] ?? null)}
        />
      </button>
    );
  }

  function renderInputPanel() {
    if (activeTool === "tts") {
      return (
        <Panel
          title="ტექსტიდან აუდიო"
          footer={
            <div className="flex flex-wrap items-center justify-between gap-3">
              <a href="#audio-history" className="text-sm text-brand-primary hover:text-brand-primary-hover">
                ისტორია
              </a>
              <Button
                type="button"
                onClick={() => void runGeneration()}
                disabled={submitting || !ttsText.trim() || !ttsVoice}
                className="rounded-full bg-brand-primary px-6 text-black hover:bg-brand-primary-hover disabled:bg-brand-primary disabled:text-black/60 disabled:opacity-100"
              >
                {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
                გენერაცია ✦ {activeToolCost}
              </Button>
            </div>
          }
        >
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-5">
              <div className="space-y-2">
                <p className="text-sm text-[#D1D1D1]">სტილის ინსტრუქცია</p>
                <Input
                  value={ttsStyleInstructions}
                  onChange={(event) => setTtsStyleInstructions(event.target.value)}
                  placeholder="წაიკითხეთ თბილი და მეგობრული ტონით"
                  className="h-12 rounded-2xl border-[#2A2A2A] bg-[#141414]"
                />
              </div>

              <div className="space-y-2">
                <p className="text-sm text-[#D1D1D1]">ტექსტი</p>
                <Textarea
                  value={ttsText}
                  onChange={(event) => setTtsText(event.target.value)}
                  placeholder="დაიწყეთ წერა ან ჩასვით ტექსტი აქ..."
                  className="min-h-[22rem] rounded-3xl border-[#2A2A2A] bg-[#141414] px-4 py-4 text-base"
                />
              </div>
            </div>

            <div className="space-y-4 rounded-[24px] border border-[#2A2A2A] bg-[#141414] p-4 lg:self-start">
              <div className="rounded-2xl border border-brand-primary bg-brand-primary px-4 py-3 text-black">
                <p className="text-xs text-black/60">რეჟიმი</p>
                <p className="mt-1 text-sm font-medium text-black">ერთი სპიკერი</p>
              </div>

              <SliderField
                label="ტემპერატურა"
                min={0}
                max={2}
                step={0.1}
                value={ttsTemperature}
                onChange={setTtsTemperature}
              />

              <div className="space-y-2">
                <p className="text-sm text-[#D1D1D1]">ხმა</p>
                {renderVoiceSelect(ttsVoice, (value) => setTtsVoice(value as GeminiVoiceOption["id"]))}
              </div>
            </div>
          </div>
        </Panel>
      );
    }

    if (activeTool === "dialogue") {
      return (
        <Panel
          title="მრავალსპიკერიანი დიალოგი"
          footer={
            <div className="flex flex-wrap items-center justify-between gap-3">
              <a href="#audio-history" className="text-sm text-brand-primary hover:text-brand-primary-hover">
                ისტორია
              </a>
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetDialogue}
                  className="rounded-full border-[#2A2A2A] bg-transparent text-white hover:border-brand-primary hover:bg-brand-primary hover:text-black"
                >
                  გადატვირთვა
                </Button>
                <Button
                  type="button"
                  onClick={() => void runGeneration()}
                  disabled={submitting || dialogueSegments.some((segment) => !segment.text.trim())}
                  className="rounded-full bg-brand-primary px-6 text-black hover:bg-brand-primary-hover disabled:bg-brand-primary disabled:text-black/60 disabled:opacity-100"
                >
                  {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
                  გენერაცია ✦ {activeToolCost}
                </Button>
              </div>
            </div>
          }
        >
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_340px]">
            <div className="space-y-5">
              <div className="space-y-2">
                <p className="text-sm text-[#D1D1D1]">სტილის ინსტრუქცია</p>
                <Input
                  value={dialogueStyleInstructions}
                  onChange={(event) => setDialogueStyleInstructions(event.target.value)}
                  placeholder="წაიკითხეთ თბილი ტონით"
                  className="h-12 rounded-2xl border-[#2A2A2A] bg-[#141414]"
                />
              </div>

              <div className="space-y-4 rounded-[24px] border border-[#2A2A2A] bg-[#141414] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-white">სცენარის აწყობა</p>
                    <p className="mt-1 text-xs leading-5 text-[#8A8A8A]">
                      ააწყვე მიმდევრობა და თითოეულ ხაზს მიუთითე რომელ სპიკერს ეკუთვნის.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {dialogueSegments.map((segment) => {
                    const speaker = getDialogueSpeaker(segment.speakerId);
                    return (
                      <div
                        key={segment.id}
                        className="rounded-3xl border border-[#2A2A2A] bg-[#0A0A0A] p-4"
                      >
                        <div className="mb-4 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <span className={cn("size-3 rounded-full", speaker.dotClassName)} />
                            <span
                              className={cn(
                                "rounded-full border px-3 py-1 text-xs font-medium",
                                speaker.toneClassName
                              )}
                            >
                              {speaker.name}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeDialogueSegment(segment.id)}
                            className="text-sm text-[#8A8A8A] hover:text-brand-primary"
                          >
                            წაშლა
                          </button>
                        </div>

                        <div className="space-y-4">
                          <div className="space-y-2">
                            <p className="text-sm text-[#D1D1D1]">რომელი სპიკერი საუბრობს</p>
                            <Select
                              value={segment.speakerId}
                              onValueChange={(value) =>
                                updateDialogueSegment(segment.id, "speakerId", value)
                              }
                            >
                              <SelectTrigger className="h-12 rounded-2xl border-[#2A2A2A] bg-[#141414]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="border-[#2A2A2A] bg-[#141414]">
                                {dialogueSpeakers.map((item) => (
                                  <SelectItem key={item.id} value={item.id}>
                                    {item.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <Textarea
                            value={segment.text}
                            onChange={(event) =>
                              updateDialogueSegment(segment.id, "text", event.target.value)
                            }
                            placeholder="დაწერე ამ სპიკერის ტექსტი..."
                            className="min-h-28 rounded-3xl border-[#2A2A2A] bg-[#141414]"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={addDialogueSegment}
                  className="w-full rounded-3xl border-dashed border-[#2A2A2A] bg-transparent py-6 text-white hover:border-brand-primary hover:bg-brand-primary/12"
                >
                  + დიალოგის დამატება
                </Button>
              </div>
            </div>

            <div className="space-y-4 rounded-[24px] border border-[#2A2A2A] bg-[#141414] p-4 lg:self-start">
              <div className="rounded-2xl border border-brand-primary bg-brand-primary px-4 py-3 text-black">
                <p className="text-xs text-black/60">რეჟიმი</p>
                <p className="mt-1 text-sm font-medium text-black">მრავალი სპიკერი</p>
              </div>

              <SliderField
                label="ტემპერატურა"
                min={0}
                max={2}
                step={0.1}
                value={dialogueTemperature}
                onChange={setDialogueTemperature}
              />

              <div className="space-y-3">
                {dialogueSpeakers.map((speaker) => (
                  <div
                    key={speaker.id}
                    className="rounded-3xl border border-[#2A2A2A] bg-[#0A0A0A] p-4"
                  >
                    <div className="mb-4 flex items-center gap-3">
                      <span className={cn("size-3 rounded-full", speaker.dotClassName)} />
                      <p className="text-sm font-medium text-white">
                        {speaker.name} - პარამეტრები
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <p className="text-sm text-[#D1D1D1]">სახელი</p>
                        <Input
                          value={speaker.name}
                          onChange={(event) =>
                            updateDialogueSpeaker(speaker.id, "name", event.target.value)
                          }
                          placeholder={speaker.name}
                          className="h-11 rounded-2xl border-[#2A2A2A] bg-[#141414]"
                        />
                      </div>

                      <div className="space-y-2">
                        <p className="text-sm text-[#D1D1D1]">ხმა</p>
                        {renderVoiceSelect(speaker.voice, (value) =>
                          updateDialogueSpeaker(speaker.id, "voice", value)
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Panel>
      );
    }

    if (activeTool === "sfx") {
      return (
        <Panel
          title="ხმოვანი ეფექტები"
          footer={
            <div className="flex flex-wrap items-center justify-between gap-3">
              <a href="#audio-history" className="text-sm text-brand-primary hover:text-brand-primary-hover">
                ისტორია
              </a>
              <Button
                type="button"
                onClick={() => void runGeneration()}
                disabled={submitting || !sfxText.trim()}
                className="rounded-full bg-brand-primary px-6 text-black hover:bg-brand-primary-hover disabled:bg-brand-primary disabled:text-black/60 disabled:opacity-100"
              >
                {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
                გენერაცია ✦ {activeToolCost}
              </Button>
            </div>
          }
        >
          <div className="space-y-5">
            <Textarea
              value={sfxText}
              onChange={(event) => setSfxText(event.target.value)}
              placeholder="აღწერეთ ხმოვანი ეფექტი..."
              className="min-h-44 rounded-3xl border-[#2A2A2A] bg-[#141414] px-4 py-4 text-base"
            />

            <div className="flex items-center justify-between rounded-2xl border border-[#2A2A2A] bg-[#141414] px-4 py-3">
              <div>
                <p className="text-sm text-white">ციკლი</p>
                <p className="mt-1 text-xs text-[#8A8A8A]">ეფექტის გამეორება უწყვეტად</p>
              </div>
              <Switch checked={sfxLoop} onCheckedChange={setSfxLoop} />
            </div>

            <SliderField
              label="ხანგრძლივობა"
              min={0.5}
              max={22}
              step={0.1}
              value={sfxDuration}
              onChange={setSfxDuration}
            />
            <SliderField
              label="პრომპტის გავლენა"
              min={0}
              max={1}
              step={0.01}
              value={sfxInfluence}
              onChange={setSfxInfluence}
            />

            <div className="space-y-2">
              <p className="text-sm text-[#D1D1D1]">ფორმატი</p>
              <Select value={sfxFormat} onValueChange={setSfxFormat}>
                <SelectTrigger className="h-12 w-full rounded-2xl border-[#2A2A2A] bg-[#141414]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-[#2A2A2A] bg-[#141414]">
                  {SOUND_EFFECT_FORMATS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Panel>
      );
    }

    if (activeTool === "isolation") {
      return (
        <Panel
          title="ხმის იზოლაცია"
          footer={
            <div className="flex flex-wrap items-center justify-between gap-3">
              <a href="#audio-history" className="text-sm text-brand-primary hover:text-brand-primary-hover">
                ისტორია
              </a>
              <Button
                type="button"
                onClick={() => void runGeneration()}
                disabled={submitting || !isolationFile}
                className="rounded-full bg-brand-primary px-6 text-black hover:bg-brand-primary-hover disabled:bg-brand-primary disabled:text-black/60 disabled:opacity-100"
              >
                {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
                იზოლაცია ✦ {activeToolCost}
              </Button>
            </div>
          }
        >
          {renderUploadArea({
            title: "ატვირთეთ აუდიო ფაილი",
            fileState: isolationFile,
            inputRef: isolationInputRef,
            onSelectFile: handleIsolationFile,
            onClear: () => {
              clearLocalFile(isolationFile);
              setIsolationFile(null);
            },
          })}
        </Panel>
      );
    }

    return (
      <Panel
        title="ტრანსკრიფცია"
        footer={
          <div className="flex flex-wrap items-center justify-between gap-3">
            <a href="#audio-history" className="text-sm text-brand-primary hover:text-brand-primary-hover">
              ისტორია
            </a>
            <Button
              type="button"
              onClick={() => void runGeneration()}
              disabled={submitting || !transcriptionFile}
              className="rounded-full bg-brand-primary px-6 text-black hover:bg-brand-primary-hover disabled:bg-brand-primary disabled:text-black/60 disabled:opacity-100"
            >
              {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
              ტრანსკრიფცია ✦ {activeToolCost}
            </Button>
          </div>
        }
      >
        <div className="space-y-5">
          {renderUploadArea({
            title: "ატვირთეთ აუდიო ფაილი",
            fileState: transcriptionFile,
            inputRef: transcriptionInputRef,
            onSelectFile: handleTranscriptionFile,
            onClear: () => {
              clearLocalFile(transcriptionFile);
              setTranscriptionFile(null);
            },
          })}

          <div className="space-y-2">
            <p className="text-sm text-[#D1D1D1]">ენის კოდი</p>
            <Select value={transcriptionLanguage} onValueChange={setTranscriptionLanguage}>
              <SelectTrigger className="h-12 w-full rounded-2xl border-[#2A2A2A] bg-[#141414]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-[#2A2A2A] bg-[#141414]">
                {LANGUAGE_OPTIONS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-2xl border border-[#2A2A2A] bg-[#141414] px-4 py-3">
              <div>
                <p className="text-sm text-white">აუდიო მოვლენების ტეგირება</p>
                <p className="mt-1 text-xs text-[#8A8A8A]">
                  მაგალითად ტაში, ხმაური ან გარემოს ხმა
                </p>
              </div>
              <Switch
                checked={transcriptionTagEvents}
                onCheckedChange={setTranscriptionTagEvents}
              />
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-[#2A2A2A] bg-[#141414] px-4 py-3">
              <div>
                <p className="text-sm text-white">სპიკერების განსაზღვრა</p>
                <p className="mt-1 text-xs text-[#8A8A8A]">
                  ტექსტში ვინ ლაპარაკობს ამის მონიშვნა
                </p>
              </div>
              <Switch
                checked={transcriptionDiarize}
                onCheckedChange={setTranscriptionDiarize}
              />
            </div>
          </div>
        </div>
      </Panel>
    );
  }

  return (
    <div className="min-h-[calc(100dvh-8rem)] bg-[#0A0A0A]">
      <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-[220px_minmax(0,1fr)]">
          <aside className="md:sticky md:top-6 md:self-start">
            <div className="overflow-hidden rounded-[28px] border border-[#2A2A2A] bg-[#141414]">
              <div className="border-b border-[#2A2A2A] px-4 py-4">
                <p className="font-display text-lg text-white">აუდიო სტუდია</p>
              </div>

              <div className="md:hidden">
                <div className="flex gap-2 overflow-x-auto px-3 py-3">
                  {TOOL_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const isActive = item.key === activeTool;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => setActiveTool(item.key)}
                        className={cn(
                          "flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors",
                          isActive
                            ? "border-brand-primary bg-brand-primary text-black"
                            : "border-[#2A2A2A] bg-[#1E1E1E] text-[#D1D1D1] hover:border-brand-primary/30 hover:bg-brand-primary/12"
                        )}
                      >
                        <Icon className="size-4" />
                        {item.title}
                      </button>
                    );
                  })}
                </div>
              </div>

              <nav className="hidden md:block">
                {TOOL_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive = item.key === activeTool;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setActiveTool(item.key)}
                      className={cn(
                        "flex w-full items-start gap-3 border-l-2 px-4 py-4 text-left transition-colors",
                        isActive
                          ? "border-l-brand-primary bg-brand-primary text-black"
                          : "border-l-transparent text-[#D1D1D1] hover:bg-brand-primary/12 hover:text-white"
                      )}
                    >
                      <Icon className="mt-0.5 size-5 shrink-0" />
                      <span className="min-w-0">
                        <span className="block font-medium">{item.title}</span>
                      </span>
                    </button>
                  );
                })}
              </nav>

              <div className="border-t border-[#2A2A2A] px-4 py-4">
                <p className="text-xs uppercase text-[#8A8A8A]">GEO კოინები</p>
                <p className="mt-2 font-display text-2xl text-brand-primary">
                  ✦ {balance.toLocaleString("ka-GE")}
                </p>
              </div>
            </div>
          </aside>

          <main className="space-y-6">
            {error ? <p className="text-sm text-brand-primary">{error}</p> : null}
            {renderInputPanel()}

            <section
              id="audio-history"
              className="rounded-[28px] border border-[#2A2A2A] bg-[#141414] p-5 sm:p-6"
            >
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-2xl text-white">ისტორია</h2>
                </div>
              </div>

              {filteredHistory.length > 0 ? (
                <div className="grid gap-3">
                  {filteredHistory.slice(0, 10).map((item) => {
                    const itemTool = getToolByModel(item.modelId);
                    const outputUrl = getResolvedAudioUrl(item.outputUrl, item.outputData);
                    const transcriptSegments = getTranscriptSegments(item.outputData);
                    const transcriptText = getTranscriptText(item);
                    const isTranscript = itemTool === "transcription";
                    const isSucceeded = item.status === "SUCCEEDED";
                    const isFailed = item.status === "FAILED" || item.status === "CANCELED";
                    const isProcessing =
                      item.status === "PENDING" || item.status === "PROCESSING";
                    const isDeleting = deletePending && deleteTarget?.id === item.id;
                    const safeItemErrorMessage = getSafeClientErrorMessage(
                      item.errorMessage,
                      getToolFailureMessage(itemTool)
                    );

                    return (
                      <article
                        key={item.id}
                        className="rounded-[28px] border border-[#2A2A2A] bg-[#1E1E1E] p-5 sm:p-6"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <p className="text-xs text-[#8A8A8A]">
                            <ClientDateText value={item.createdAt} format={formatDate} />
                            {" · ✦ "}
                            {item.creditsUsed}
                          </p>
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={cn(
                                "rounded-full px-3 py-1 text-xs",
                                item.status === "SUCCEEDED"
                                  ? "bg-brand-primary text-black"
                                  : item.status === "FAILED" || item.status === "CANCELED"
                                    ? "bg-[#2A2A2A] text-[#A3A3A3]"
                                    : "bg-brand-primary text-black"
                              )}
                            >
                              {getStatusLabel(item.status)}
                            </span>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => {
                                setDeleteError(null);
                                setDeleteTarget(item);
                              }}
                              disabled={isDeleting}
                              className="size-10 rounded-full border-[#2A2A2A] bg-transparent text-white hover:border-brand-primary hover:bg-brand-primary hover:text-black"
                              aria-label="შედეგის წაშლა"
                            >
                              {isDeleting ? (
                                <Loader2 className="size-4 animate-spin" />
                              ) : (
                                <Trash2 className="size-4" />
                              )}
                            </Button>
                          </div>
                        </div>

                        <div className="mt-4 rounded-3xl border border-[#2A2A2A] bg-[#141414] p-4">
                          {isSucceeded && isTranscript ? (
                            <div className="space-y-4">
                              <div className="max-h-[24rem] overflow-y-auto rounded-3xl border border-[#2A2A2A] bg-[#0A0A0A] p-4">
                                <div className="space-y-3">
                                  {transcriptSegments.length > 0 ? (
                                    transcriptSegments.map((segment, index) => (
                                      <div
                                        key={`${segment.speaker ?? "speaker"}-${index}`}
                                        className="rounded-2xl border border-[#2A2A2A] bg-[#141414] p-3"
                                      >
                                        {segment.speaker ? (
                                          <p className="mb-2 text-xs font-medium text-brand-primary">
                                            {segment.speaker}
                                          </p>
                                        ) : null}
                                        <p className="text-sm leading-7 text-[#D1D1D1]">
                                          {segment.text}
                                        </p>
                                      </div>
                                    ))
                                  ) : (
                                    <p className="whitespace-pre-wrap text-sm leading-7 text-[#D1D1D1]">
                                      {transcriptText}
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className="flex flex-wrap items-center justify-end gap-3 border-t border-[#2A2A2A] pt-1">
                                <div className="flex flex-wrap items-center gap-3">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => void copyTranscript(item)}
                                    className="rounded-full border-[#2A2A2A] bg-transparent text-white hover:border-brand-primary hover:bg-brand-primary hover:text-black"
                                  >
                                    <Copy className="size-4" />
                                    {copiedHistoryId === item.id ? "დაკოპირდა" : "კოპირება"}
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => downloadTranscript(item)}
                                    className="rounded-full border-[#2A2A2A] bg-transparent text-white hover:border-brand-primary hover:bg-brand-primary hover:text-black"
                                  >
                                    ჩამოტვირთვა
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ) : isSucceeded && outputUrl ? (
                            <AudioPlayer
                              src={outputUrl}
                              downloadName={getAudioDownloadName(itemTool)}
                            />
                          ) : isProcessing ? (
                            <div className="flex min-h-44 flex-col items-center justify-center text-center">
                              <Loader2 className="size-7 animate-spin text-brand-primary" />
                              <p className="mt-4 text-lg text-white">აუდიო მუშავდება</p>
                              <p className="mt-2 max-w-md text-sm leading-6 text-[#8A8A8A]">
                                გენერაცია მიმდინარეობს. დასრულების შემდეგ შედეგი აქ გამოჩნდება.
                              </p>
                            </div>
                          ) : isFailed ? (
                            <div className="flex min-h-44 flex-col items-center justify-center text-center">
                              <p className="text-lg text-white">გენერაცია ვერ შესრულდა</p>
                              <p className="mt-2 max-w-md text-sm leading-6 text-[#8A8A8A]">
                                {safeItemErrorMessage}
                              </p>
                            </div>
                          ) : (
                            <div className="flex min-h-44 flex-col items-center justify-center text-center">
                              <p className="text-lg text-white">შედეგი ჯერ არ არის ხელმისაწვდომი</p>
                            </div>
                          )}
                        </div>

                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-3xl border border-dashed border-[#2A2A2A] bg-[#1E1E1E] px-6 py-12 text-center">
                  <p className="text-lg text-white">ჯერ ისტორია არ არის</p>
                  <p className="mt-2 text-sm leading-6 text-[#8A8A8A]">
                    პირველი შედეგის გენერაციის შემდეგ აქ გამოჩნდება.
                  </p>
                </div>
              )}
            </section>

            <AlertDialog
              open={Boolean(deleteTarget)}
              onOpenChange={(open) => {
                if (!open) {
                  setDeleteTarget(null);
                  setDeleteError(null);
                }
              }}
            >
              <AlertDialogContent className="rounded-[28px] border-[#2A2A2A] bg-[#141414] text-white">
                <AlertDialogHeader>
                  <AlertDialogTitle>შედეგის წაშლა</AlertDialogTitle>
                  <AlertDialogDescription className="text-[#A3A3A3]">
                    ნამდვილად გსურს ამ გენერირებული შედეგის წაშლა? მოქმედება ვეღარ დაბრუნდება.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                {deleteTarget ? (
                  <div className="rounded-3xl border border-[#2A2A2A] bg-[#0A0A0A] px-4 py-3">
                    <p className="text-sm text-white">{deleteTarget.modelName}</p>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#8A8A8A]">
                      {getHistoryPreview(deleteTarget)}
                    </p>
                  </div>
                ) : null}
                {deleteError ? <p className="text-sm text-brand-primary">{deleteError}</p> : null}
                <AlertDialogFooter>
                  <AlertDialogCancel className="rounded-full border-[#2A2A2A] bg-transparent text-white hover:bg-[#1E1E1E]">
                    გაუქმება
                  </AlertDialogCancel>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => void deleteHistoryItem()}
                    disabled={deletePending}
                    className="rounded-full"
                  >
                    {deletePending ? <Loader2 className="size-4 animate-spin" /> : null}
                    წაშლა
                  </Button>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </main>
        </div>
      </div>
    </div>
  );
}
