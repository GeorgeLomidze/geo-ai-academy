"use client";

import type { ReactNode, RefObject } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  AudioLines,
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
import type { AIHistoryItem } from "@/components/ai/types";
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
  GEMINI_DIALOGUE_MODEL_OPTIONS,
  GEMINI_TTS_MODEL_OPTIONS,
  GEMINI_VOICE_OPTIONS,
  type GeminiDialogueModelId,
  type GeminiSingleSpeakerModelId,
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

type OutputState = {
  generationId: string | null;
  tool: ToolKey;
  outputUrl: string | null;
  outputText: string | null;
  outputData: TranscriptSegment[];
  status: AIHistoryItem["status"];
  creditsUsed: number;
  createdAt: string;
  prompt: string | null;
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
  description: string;
  cost: number;
}> = [
  {
    key: "tts",
    title: "წაკითხვა",
    icon: Volume2,
    description: "ტექსტის წაკითხვა Google Gemini TTS-ით",
    cost: 3,
  },
  {
    key: "dialogue",
    title: "დიალოგი",
    icon: MessageCircleMore,
    description: "ორ სპიკერამდე ხმოვანი დიალოგი Google Gemini-ით",
    cost: 4,
  },
  {
    key: "sfx",
    title: "ხმოვანი ეფექტები",
    icon: Music2,
    description: "სცენის ან ეფექტის ხმოვანი ატმოსფერო",
    cost: 8,
  },
  {
    key: "isolation",
    title: "ხმის იზოლაცია",
    icon: Waves,
    description: "ხმიდან ფონის მოშორება და ვოკალის გაწმენდა",
    cost: 9,
  },
  {
    key: "transcription",
    title: "ტრანსკრიფცია",
    icon: FileAudio,
    description: "აუდიოს ტექსტად გადაყვანა და სპიკერების გაყოფა",
    cost: 12,
  },
];

const SOUND_EFFECT_FORMATS = [
  { value: "mp3_44100_128", label: "MP3 44100Hz 128kbps" },
  { value: "mp3_44100_192", label: "MP3 44100Hz 192kbps" },
  { value: "pcm_44100", label: "PCM 44100Hz" },
];

const LANGUAGE_OPTIONS = [
  { value: "kat", label: "ქართული" },
  { value: "eng", label: "ინგლისური" },
  { value: "rus", label: "რუსული" },
  { value: "tur", label: "თურქული" },
  { value: "deu", label: "გერმანული" },
  { value: "fra", label: "ფრანგული" },
  { value: "spa", label: "ესპანური" },
];

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
  return new Intl.DateTimeFormat("ka-GE", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getSafeClientErrorMessage(message: string | null | undefined) {
  if (!message) {
    return "გენერაციის დროს მოხდა შეცდომა. სცადეთ თავიდან";
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
    normalized.includes("invalid value for argument")
  ) {
    return "გენერაციის დროს მოხდა შეცდომა. სცადეთ თავიდან";
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

function createDialogueSegment(speakerId = "speaker-1"): DialogueSegment {
  return {
    id: crypto.randomUUID(),
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
      toneClassName: "border-[#F5A623]/40 bg-[#F5A623]/10 text-[#F5A623]",
      dotClassName: "bg-[#F5A623]",
    },
    {
      id: "speaker-2",
      name: "სპიკერი 2",
      voice: "Kore",
      toneClassName: "border-[#E09000]/40 bg-[#E09000]/10 text-[#E09000]",
      dotClassName: "bg-[#E09000]",
    },
  ];
}

function VoiceSelect({
  value,
  onValueChange,
  model,
  onPreview,
  previewLoadingKey,
  previewPlayingKey,
}: {
  value: GeminiVoiceOption["id"];
  onValueChange: (value: GeminiVoiceOption["id"]) => void;
  model: GeminiSingleSpeakerModelId | GeminiDialogueModelId;
  onPreview: (
    voice: GeminiVoiceOption["id"],
    model: GeminiSingleSpeakerModelId | GeminiDialogueModelId
  ) => void;
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
        <span className="min-w-0">
          <span className="block truncate">{selectedVoice.name}</span>
          <span className="block truncate text-xs text-[#8A8A8A]">
            {selectedVoice.description}
          </span>
        </span>
        <ChevronDown
          className={cn("size-4 shrink-0 text-[#8A8A8A] transition-transform", open && "rotate-180")}
        />
      </button>

      {open ? (
        <div className="absolute top-full left-0 z-50 mt-2 w-full overflow-hidden rounded-2xl border border-[#2A2A2A] bg-[#141414] shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
          <div className="h-80 overflow-y-auto overscroll-contain p-1.5">
            {GEMINI_VOICE_OPTIONS.map((voice) => {
              const previewKey = `${model}:${voice.id}`;
              const isLoading = previewLoadingKey === previewKey;
              const isPlaying = previewPlayingKey === previewKey;
              const isSelected = voice.id === value;

              return (
                <div
                  key={voice.id}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl px-2 py-2",
                    isSelected ? "bg-[#F5A623]/10" : "hover:bg-[#1E1E1E]"
                  )}
                >
                  <button
                    type="button"
                    aria-label={`${voice.name} ხმის მოსმენა`}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      onPreview(voice.id, model);
                    }}
                    className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#F5A623] text-black transition-colors hover:bg-[#FFD60A]"
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
                    className="flex min-w-0 flex-1 flex-col text-left"
                  >
                    <span className="truncate text-white">{voice.name}</span>
                    <span className="truncate text-xs text-[#8A8A8A]">
                      {voice.description}
                    </span>
                  </button>

                  {isSelected ? (
                    <Check className="size-4 shrink-0 text-[#F5A623]" />
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
  return (
    <label className="block">
      <div className="mb-2 flex items-center justify-between text-sm text-[#D1D1D1]">
        <span>{label}</span>
        <span className="tabular-nums text-[#F5A623]">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-2 w-full cursor-pointer accent-[#F5A623]"
      />
    </label>
  );
}

function Panel({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-[#2A2A2A] bg-[#1E1E1E] p-5 sm:p-6">
      <div className="mb-5">
        <h2 className="font-display text-xl text-white">{title}</h2>
        {description ? (
          <p className="mt-2 text-sm leading-6 text-[#A3A3A3]">{description}</p>
        ) : null}
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
  const [activeTool, setActiveTool] = useState<ToolKey>("tts");
  const [balance, setBalance] = useState(initialBalance);
  const [history, setHistory] = useState(initialHistory);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  const [ttsStyleInstructions, setTtsStyleInstructions] = useState("");
  const [ttsText, setTtsText] = useState("");
  const [ttsVoice, setTtsVoice] = useState<GeminiVoiceOption["id"]>("Kore");
  const [ttsModel, setTtsModel] = useState<GeminiSingleSpeakerModelId>("audio_tts_flash");
  const [ttsTemperature, setTtsTemperature] = useState(1);

  const [dialogueSegments, setDialogueSegments] = useState<DialogueSegment[]>([
    createDialogueSegment("speaker-1"),
    createDialogueSegment("speaker-2"),
  ]);
  const [dialogueSpeakers, setDialogueSpeakers] = useState<DialogueSpeaker[]>(
    createDialogueSpeakers()
  );
  const [dialogueStyleInstructions, setDialogueStyleInstructions] = useState("");
  const [dialogueModel, setDialogueModel] =
    useState<GeminiDialogueModelId>("audio_dialogue_flash");
  const [dialogueTemperature, setDialogueTemperature] = useState(1);

  const [sfxText, setSfxText] = useState("");
  const [sfxLoop, setSfxLoop] = useState(false);
  const [sfxDuration, setSfxDuration] = useState(11.25);
  const [sfxInfluence, setSfxInfluence] = useState(0.3);
  const [sfxFormat, setSfxFormat] = useState("mp3_44100_128");

  const [isolationFile, setIsolationFile] = useState<LocalAudioFile | null>(null);
  const [transcriptionFile, setTranscriptionFile] = useState<LocalAudioFile | null>(null);
  const [transcriptionLanguage, setTranscriptionLanguage] = useState("kat");
  const [transcriptionTagEvents, setTranscriptionTagEvents] = useState(true);
  const [transcriptionDiarize, setTranscriptionDiarize] = useState(true);

  const [currentOutput, setCurrentOutput] = useState<OutputState | null>(null);
  const [previewLoadingKey, setPreviewLoadingKey] = useState<string | null>(null);
  const [previewPlayingKey, setPreviewPlayingKey] = useState<string | null>(null);

  const isolationInputRef = useRef<HTMLInputElement | null>(null);
  const transcriptionInputRef = useRef<HTMLInputElement | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const previewCacheRef = useRef<Record<string, string>>({});

  const activeToolConfig = getToolConfig(activeTool);
  const activeToolCost =
    activeTool === "tts"
      ? AUDIO_MODELS[ttsModel].coins
      : activeTool === "dialogue"
        ? AUDIO_MODELS[dialogueModel].coins
        : activeToolConfig.cost;
  const filteredHistory = useMemo(
    () => history.filter((item) => getToolByModel(item.modelId) === activeTool),
    [activeTool, history]
  );

  useEffect(() => {
    if ((!currentOutput || currentOutput.tool !== activeTool) && filteredHistory[0]) {
      const firstItem = filteredHistory[0];
      setCurrentOutput({
        generationId: firstItem.id,
        tool: getToolByModel(firstItem.modelId),
        outputUrl: getResolvedAudioUrl(firstItem.outputUrl, firstItem.outputData),
        outputText: firstItem.outputText ?? null,
        outputData: (firstItem.outputData as TranscriptSegment[] | undefined) ?? [],
        status: firstItem.status,
        creditsUsed: firstItem.creditsUsed,
        createdAt: firstItem.createdAt,
        prompt: firstItem.prompt,
      });
    }
  }, [activeTool, currentOutput, filteredHistory]);

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
    setDialogueSpeakers(speakers);
    setDialogueSegments([
      createDialogueSegment(speakers[0].id),
      createDialogueSegment(speakers[1].id),
    ]);
    setDialogueStyleInstructions("");
    setDialogueModel("audio_dialogue_flash");
    setDialogueTemperature(1);
  }

  function addDialogueSegment() {
    setDialogueSegments((current) => [
      ...current,
      createDialogueSegment(
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

  const dialogueRawStructure = [
    dialogueStyleInstructions.trim() ? dialogueStyleInstructions.trim() : "სტილის ინსტრუქცია",
    ...dialogueSegments.map((segment) => {
      const speaker = getDialogueSpeaker(segment.speakerId);
      return `${speaker.name}: ${segment.text.trim() || "ტექსტი"}`;
    }),
  ].join("\n");

  async function runGeneration() {
    setSubmitting(true);
    setError(null);
    setCopySuccess(false);

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
            model: ttsModel,
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
            model: dialogueModel,
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
                    language_code: transcriptionLanguage,
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
            ? ttsModel
            : tool === "dialogue"
              ? dialogueModel
              : tool === "sfx"
                ? "audio_sfx"
                : tool === "isolation"
                  ? "audio_isolation"
                  : "audio_transcription",
        modelName:
          tool === "tts"
            ? AUDIO_MODELS[ttsModel].name
            : tool === "dialogue"
              ? AUDIO_MODELS[dialogueModel].name
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
      setCurrentOutput({
        generationId: historyItem.id,
        tool,
        outputUrl: getResolvedAudioUrl(historyItem.outputUrl, historyItem.outputData),
        outputText: historyItem.outputText ?? null,
        outputData: (historyItem.outputData as TranscriptSegment[] | undefined) ?? [],
        status: historyItem.status,
        creditsUsed: historyItem.creditsUsed,
        createdAt: historyItem.createdAt,
        prompt: historyItem.prompt,
      });
    } catch (generationError) {
      setError(
        getSafeClientErrorMessage(
          generationError instanceof Error
            ? generationError.message
            : "გენერაციის დროს მოხდა შეცდომა. სცადეთ თავიდან"
        )
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function copyTranscript() {
    if (!currentOutput?.outputText) {
      return;
    }

    await navigator.clipboard.writeText(currentOutput.outputText);
    setCopySuccess(true);
    window.setTimeout(() => setCopySuccess(false), 1800);
  }

  function stopVoicePreview() {
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current.currentTime = 0;
    }
    setPreviewPlayingKey(null);
  }

  async function playVoicePreview(
    voice: GeminiVoiceOption["id"],
    model: GeminiSingleSpeakerModelId | GeminiDialogueModelId
  ) {
    const cacheKey = `${model}:${voice}`;

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
            model,
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
      setError(
        getSafeClientErrorMessage(
          previewError instanceof Error
            ? previewError.message
            : "ხმის მოსმენა დროებით ვერ მოხერხდა"
        )
      );
    } finally {
      setPreviewLoadingKey(null);
    }
  }

  function renderVoiceSelect(
    value: string,
    onValueChange: (value: string) => void,
    model: GeminiSingleSpeakerModelId | GeminiDialogueModelId
  ) {
    return (
      <VoiceSelect
        value={value as GeminiVoiceOption["id"]}
        onValueChange={(nextValue) => onValueChange(nextValue)}
        model={model}
        onPreview={(voice, previewModel) => {
          void playVoicePreview(voice, previewModel);
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
            className="rounded-full border-[#2A2A2A] bg-transparent text-white hover:border-[#F5A623] hover:bg-[#F5A623]/10"
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
        className="flex min-h-56 w-full flex-col items-center justify-center rounded-3xl border border-dashed border-[#2A2A2A] bg-[#141414] px-6 text-center transition-colors hover:border-[#F5A623] hover:bg-[#F5A623]/5"
      >
        <div className="flex size-14 items-center justify-center rounded-full bg-[#F5A623]/10 text-[#F5A623]">
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
          description="სტილის ინსტრუქციით მართე ტონი, ტემპი და ხმის ხასიათი Google Gemini TTS-ით."
          footer={
            <div className="flex flex-wrap items-center justify-between gap-3">
              <a href="#audio-history" className="text-sm text-[#F5A623] hover:text-[#FFD60A]">
                ისტორია
              </a>
              <Button
                type="button"
                onClick={() => void runGeneration()}
                disabled={submitting || !ttsText.trim() || !ttsVoice}
                className="rounded-full bg-[#F5A623] px-6 text-black hover:bg-[#FFD60A]"
              >
                {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
                გენერაცია ✦ {activeToolCost}
              </Button>
            </div>
          }
        >
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
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

            <div className="space-y-4 rounded-[24px] border border-[#2A2A2A] bg-[#141414] p-4">
              <div className="space-y-2">
                <p className="text-sm text-[#D1D1D1]">მოდელი</p>
                <Select
                  value={ttsModel}
                  onValueChange={(value) => setTtsModel(value as GeminiSingleSpeakerModelId)}
                >
                  <SelectTrigger className="h-12 rounded-2xl border-[#2A2A2A] bg-[#0A0A0A]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-[#2A2A2A] bg-[#141414]">
                    {GEMINI_TTS_MODEL_OPTIONS.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-2xl border border-[#F5A623]/20 bg-[#F5A623]/10 px-4 py-3">
                <p className="text-xs text-[#A3A3A3]">რეჟიმი</p>
                <p className="mt-1 text-sm font-medium text-[#F5A623]">ერთი სპიკერი</p>
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
                {renderVoiceSelect(
                  ttsVoice,
                  (value) => setTtsVoice(value as GeminiVoiceOption["id"]),
                  ttsModel
                )}
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
          description="Gemini დიალოგი ამ ეტაპზე ორ სპიკერს უჭერს მხარს. მარცხნივ ააწყვე სცენარი, მარჯვნივ დააყენე ხმები."
          footer={
            <div className="flex flex-wrap items-center justify-between gap-3">
              <a href="#audio-history" className="text-sm text-[#F5A623] hover:text-[#FFD60A]">
                ისტორია
              </a>
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetDialogue}
                  className="rounded-full border-[#2A2A2A] bg-transparent text-white hover:border-[#F5A623] hover:bg-[#F5A623]/10"
                >
                  გადატვირთვა
                </Button>
                <Button
                  type="button"
                  onClick={() => void runGeneration()}
                  disabled={submitting || dialogueSegments.some((segment) => !segment.text.trim())}
                  className="rounded-full bg-[#F5A623] px-6 text-black hover:bg-[#FFD60A]"
                >
                  {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
                  გენერაცია ✦ {activeToolCost}
                </Button>
              </div>
            </div>
          }
        >
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
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

              <div className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,0.95fr)]">
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
                    {dialogueSegments.map((segment, index) => {
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
                              className="text-sm text-[#8A8A8A] hover:text-[#F5A623]"
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
                    className="w-full rounded-3xl border-dashed border-[#2A2A2A] bg-transparent py-6 text-white hover:border-[#F5A623] hover:bg-[#F5A623]/5"
                  >
                    + დიალოგის დამატება
                  </Button>
                </div>

                <details className="rounded-[24px] border border-[#2A2A2A] bg-[#141414] p-4">
                  <summary className="cursor-pointer list-none text-sm font-medium text-white">
                    ტექსტური სტრუქტურა
                  </summary>
                  <p className="mt-2 text-xs leading-5 text-[#8A8A8A]">
                    ეს არის ტექსტური სტრუქტურა, რომელსაც Gemini დიალოგის გენერაციისთვის იღებს.
                  </p>
                  <pre className="mt-4 overflow-x-auto whitespace-pre-wrap rounded-3xl border border-[#2A2A2A] bg-[#0A0A0A] p-4 text-xs leading-6 text-[#D1D1D1]">
                    {dialogueRawStructure}
                  </pre>
                </details>
              </div>
            </div>

            <div className="space-y-4 rounded-[24px] border border-[#2A2A2A] bg-[#141414] p-4">
              <div className="space-y-2">
                <p className="text-sm text-[#D1D1D1]">მოდელი</p>
                <Select
                  value={dialogueModel}
                  onValueChange={(value) => setDialogueModel(value as GeminiDialogueModelId)}
                >
                  <SelectTrigger className="h-12 rounded-2xl border-[#2A2A2A] bg-[#0A0A0A]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-[#2A2A2A] bg-[#141414]">
                    {GEMINI_DIALOGUE_MODEL_OPTIONS.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-2xl border border-[#F5A623]/20 bg-[#F5A623]/10 px-4 py-3">
                <p className="text-xs text-[#A3A3A3]">რეჟიმი</p>
                <p className="mt-1 text-sm font-medium text-[#F5A623]">მრავალი სპიკერი</p>
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
                        {renderVoiceSelect(
                          speaker.voice,
                          (value) => updateDialogueSpeaker(speaker.id, "voice", value),
                          dialogueModel
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
          description="მოკლე ტექსტური აღწერით შექმენი გარემოს ხმა, ეფექტი ან ატმოსფერო."
          footer={
            <div className="flex flex-wrap items-center justify-between gap-3">
              <a href="#audio-history" className="text-sm text-[#F5A623] hover:text-[#FFD60A]">
                ისტორია
              </a>
              <Button
                type="button"
                onClick={() => void runGeneration()}
                disabled={submitting || !sfxText.trim()}
                className="rounded-full bg-[#F5A623] px-6 text-black hover:bg-[#FFD60A]"
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
          description="ატვირთე აუდიო ფაილი და მიიღე გაწმენდილი ხმა ფონური შრის გარეშე."
          footer={
            <div className="flex flex-wrap items-center justify-between gap-3">
              <a href="#audio-history" className="text-sm text-[#F5A623] hover:text-[#FFD60A]">
                ისტორია
              </a>
              <Button
                type="button"
                onClick={() => void runGeneration()}
                disabled={submitting || !isolationFile}
                className="rounded-full bg-[#F5A623] px-6 text-black hover:bg-[#FFD60A]"
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
        description="აუდიოდან მიიღე ტექსტი, საჭიროების შემთხვევაში სპიკერების გამოყოფით."
        footer={
          <div className="flex flex-wrap items-center justify-between gap-3">
            <a href="#audio-history" className="text-sm text-[#F5A623] hover:text-[#FFD60A]">
              ისტორია
            </a>
            <Button
              type="button"
              onClick={() => void runGeneration()}
              disabled={submitting || !transcriptionFile}
              className="rounded-full bg-[#F5A623] px-6 text-black hover:bg-[#FFD60A]"
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

  function renderOutputPanel() {
    const outputToolMatches = currentOutput?.tool === activeTool;
    const output = outputToolMatches ? currentOutput : null;

    if (activeTool === "transcription" && output?.outputText) {
      return (
        <Panel
          title="ტექსტური შედეგი"
          description="ტრანსკრიფცია მზადაა. შეგიძლია ტექსტი დააკოპირო ან TXT ფაილად გადმოწერო."
          footer={
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs text-[#8A8A8A]">
                {formatDate(output.createdAt)} · ✦ {output.creditsUsed}
              </span>
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void copyTranscript()}
                  className="rounded-full border-[#2A2A2A] bg-transparent text-white hover:border-[#F5A623] hover:bg-[#F5A623]/10"
                >
                  <Copy className="size-4" />
                  {copySuccess ? "დაკოპირდა" : "კოპირება"}
                </Button>
                {output.outputUrl ? (
                  <Button
                    asChild
                    variant="outline"
                    className="rounded-full border-[#2A2A2A] bg-transparent text-white hover:border-[#F5A623] hover:bg-[#F5A623]/10"
                  >
                    <a href={output.outputUrl} download="transcript.txt">
                      ჩამოტვირთვა
                    </a>
                  </Button>
                ) : null}
              </div>
            </div>
          }
        >
          <div className="max-h-[28rem] overflow-y-auto rounded-3xl border border-[#2A2A2A] bg-[#141414] p-4">
            <div className="space-y-4">
              {output.outputData.length > 0 ? (
                output.outputData.map((segment, index) => (
                  <div key={`${segment.speaker ?? "s"}-${index}`} className="rounded-2xl border border-[#2A2A2A] bg-[#0A0A0A] p-3">
                    {segment.speaker ? (
                      <p className="mb-2 text-xs font-medium text-[#F5A623]">
                        {segment.speaker}
                      </p>
                    ) : null}
                    <p className="text-sm leading-7 text-[#D1D1D1]">{segment.text}</p>
                  </div>
                ))
              ) : (
                <p className="whitespace-pre-wrap text-sm leading-7 text-[#D1D1D1]">
                  {output.outputText}
                </p>
              )}
            </div>
          </div>
        </Panel>
      );
    }

    if (output?.outputUrl) {
      return (
        <Panel
          title="აუდიო შედეგი"
          description="მოსმენა, ხმაურის კონტროლი და ჩამოტვირთვა ერთ პანელში."
          footer={
            <span className="text-xs text-[#8A8A8A]">
              {formatDate(output.createdAt)} · ✦ {output.creditsUsed}
            </span>
          }
        >
          <AudioPlayer
            src={output.outputUrl}
            downloadName={
              activeTool === "tts" || activeTool === "dialogue"
                ? `${activeTool}.wav`
                : `${activeTool}.mp3`
            }
          />
        </Panel>
      );
    }

    return (
      <Panel
        title="შედეგი"
        description="გენერაციის დასრულების შემდეგ შედეგი აქ გამოჩნდება."
      >
        <div className="flex min-h-80 flex-col items-center justify-center rounded-3xl border border-dashed border-[#2A2A2A] bg-[#141414] px-6 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-[#F5A623]/10 text-[#F5A623]">
            <AudioLines className="size-6" />
          </div>
          <p className="mt-5 text-lg text-white">{activeToolConfig.title}</p>
          <p className="mt-2 max-w-sm text-sm leading-6 text-[#8A8A8A]">
            {activeTool === "transcription"
              ? "ტრანსკრიფციის ტექსტი აქ გამოჩნდება."
              : "აუდიო შედეგი აქ გამოჩნდება და შეძლებ მოსმენას."}
          </p>
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
                            ? "border-[#FFD60A] bg-[#FFD60A]/15 text-[#FFD60A]"
                            : "border-[#2A2A2A] bg-[#1E1E1E] text-[#D1D1D1] hover:border-[#FFD60A]/30 hover:bg-[#FFD60A]/5"
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
                          ? "border-l-[#FFD60A] bg-[#FFD60A]/15 text-[#FFD60A]"
                          : "border-l-transparent text-[#D1D1D1] hover:bg-[#FFD60A]/5 hover:text-white"
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
                <p className="mt-2 font-display text-2xl text-[#FFD60A]">
                  ✦ {balance.toLocaleString("ka-GE")}
                </p>
              </div>
            </div>
          </aside>

          <main className="space-y-6">
            <header className="rounded-[28px] border border-[#2A2A2A] bg-[#141414] px-5 py-5 sm:px-6">
              <p className="text-sm text-[#F5A623]">{activeToolConfig.title}</p>
              <h1 className="mt-2 font-display text-3xl text-white sm:text-4xl">
                აუდიო გენერაცია
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-[#A3A3A3] sm:text-base">
                {activeToolConfig.description}
              </p>
              {error ? (
                <p className="mt-3 text-sm text-[#F5A623]">{error}</p>
              ) : null}
            </header>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,11fr)_minmax(360px,9fr)]">
              {renderInputPanel()}
              {renderOutputPanel()}
            </div>

            <section
              id="audio-history"
              className="rounded-[28px] border border-[#2A2A2A] bg-[#141414] p-5 sm:p-6"
            >
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-2xl text-white">ისტორია</h2>
                  <p className="mt-2 text-sm text-[#8A8A8A]">
                    მიმდინარე ინსტრუმენტის ბოლო გენერაციები
                  </p>
                </div>
              </div>

              {filteredHistory.length > 0 ? (
                <div className="grid gap-3">
                  {filteredHistory.slice(0, 10).map((item) => {
                    const isSelected = currentOutput?.generationId === item.id;
                    const itemTool = getToolByModel(item.modelId);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setActiveTool(itemTool);
                          setCurrentOutput({
                            generationId: item.id,
                            tool: itemTool,
                            outputUrl: getResolvedAudioUrl(item.outputUrl, item.outputData),
                            outputText: item.outputText ?? null,
                            outputData:
                              (item.outputData as TranscriptSegment[] | undefined) ?? [],
                            status: item.status,
                            creditsUsed: item.creditsUsed,
                            createdAt: item.createdAt,
                            prompt: item.prompt,
                          });
                        }}
                        className={cn(
                          "rounded-3xl border px-4 py-4 text-left transition-colors",
                          isSelected
                            ? "border-[#F5A623] bg-[#F5A623]/10"
                            : "border-[#2A2A2A] bg-[#1E1E1E] hover:border-[#F5A623]/40"
                        )}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-medium text-white">{item.modelName}</p>
                            <p className="mt-1 text-xs text-[#8A8A8A]">
                              {formatDate(item.createdAt)} · ✦ {item.creditsUsed}
                            </p>
                          </div>
                          <span
                            className={cn(
                              "rounded-full px-3 py-1 text-xs",
                              item.status === "SUCCEEDED"
                                ? "bg-[#F5A623]/10 text-[#F5A623]"
                                : item.status === "FAILED"
                                  ? "bg-[#2A2A2A] text-[#A3A3A3]"
                                  : "bg-[#F5A623]/10 text-[#F5A623]"
                            )}
                          >
                            {item.status === "SUCCEEDED"
                              ? "მზადაა"
                              : item.status === "FAILED"
                                ? "ვერ შესრულდა"
                                : "მუშავდება"}
                          </span>
                        </div>

                        <p className="mt-3 line-clamp-2 text-sm leading-6 text-[#D1D1D1]">
                          {item.outputText ?? item.prompt ?? "ფაილზე დაფუძნებული გენერაცია"}
                        </p>
                      </button>
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
          </main>
        </div>
      </div>
    </div>
  );
}
