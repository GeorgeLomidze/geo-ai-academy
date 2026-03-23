"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Download, Pause, Play, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AudioPlayerProps = {
  src: string;
  className?: string;
  downloadName?: string;
  showDownload?: boolean;
};

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return "0:00";
  }

  const minutes = Math.floor(seconds / 60);
  const remainder = Math.floor(seconds % 60);
  return `${minutes}:${String(remainder).padStart(2, "0")}`;
}

export function AudioPlayer({
  src,
  className,
  downloadName = "audio.mp3",
  showDownload = true,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => setDuration(audio.duration || 0);
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime || 0);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(audio.duration || 0);
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [src]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.pause();
    audio.currentTime = 0;
    audio.load();
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  }, [src]);

  const progress = useMemo(() => {
    if (duration <= 0) return 0;
    return Math.min((currentTime / duration) * 100, 100);
  }, [currentTime, duration]);

  async function togglePlayback() {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      await audio.play();
    } else {
      audio.pause();
    }
  }

  function handleSeek(nextValue: number) {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = nextValue;
    setCurrentTime(nextValue);
  }

  function handleVolumeChange(nextValue: number) {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = nextValue;
    setVolume(nextValue);
  }

  return (
    <div
      className={cn(
        "rounded-3xl border border-[#2A2A2A] bg-[#1E1E1E] p-5",
        className
      )}
    >
      <audio ref={audioRef} preload="metadata">
        <source src={src} />
      </audio>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => void togglePlayback()}
          className="flex size-12 items-center justify-center rounded-full bg-[#F5A623] text-black transition-colors hover:bg-[#FFD60A]"
          aria-label={isPlaying ? "დაპაუზება" : "გაშვება"}
        >
          {isPlaying ? <Pause className="size-5" /> : <Play className="ml-0.5 size-5" />}
        </button>

        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-center justify-between text-xs text-[#D1D1D1]">
            <span className="tabular-nums">{formatTime(currentTime)}</span>
            <span className="tabular-nums">{formatTime(duration)}</span>
          </div>

          <div className="relative">
            <div className="h-2 rounded-full bg-[#2A2A2A]" />
            <div
              className="pointer-events-none absolute inset-y-0 left-0 rounded-full bg-[#F5A623]"
              style={{ width: `${progress}%` }}
            />
            <input
              type="range"
              min={0}
              max={duration || 0}
              step={0.1}
              value={Math.min(currentTime, duration || 0)}
              onChange={(event) => handleSeek(Number(event.target.value))}
              className="absolute inset-0 h-2 w-full cursor-pointer appearance-none bg-transparent accent-[#F5A623]"
              aria-label="დროის ხაზი"
            />
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#2A2A2A] pt-4">
        <div className="flex items-center gap-3">
          {volume <= 0.01 ? (
            <VolumeX className="size-4 text-[#D1D1D1]" />
          ) : (
            <Volume2 className="size-4 text-[#D1D1D1]" />
          )}
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(event) => handleVolumeChange(Number(event.target.value))}
            className="h-2 w-28 cursor-pointer accent-[#F5A623]"
            aria-label="ხმის დონე"
          />
        </div>

        {showDownload ? (
          <Button
            asChild
            variant="outline"
            className="rounded-full border-[#2A2A2A] bg-transparent text-white hover:border-[#F5A623] hover:bg-[#F5A623]/10 hover:text-white"
          >
            <a href={src} download={downloadName}>
              <Download className="size-4" />
              ჩამოტვირთვა
            </a>
          </Button>
        ) : null}
      </div>
    </div>
  );
}
