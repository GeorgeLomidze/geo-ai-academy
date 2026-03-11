"use client";

import { useState } from "react";
import Image from "next/image";
import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function TrainerPortrait() {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className="relative h-[420px] w-full max-w-[420px] overflow-hidden rounded-xl border border-white/10 shadow-2xl sm:h-[500px] sm:max-w-[460px] lg:h-[540px] lg:max-w-[500px]">
      <div
        aria-hidden="true"
        className={cn(
          "absolute inset-0 z-10 flex items-center justify-center bg-[#191919] transition-opacity duration-200 ease-out",
          isLoaded ? "pointer-events-none opacity-0" : "opacity-100"
        )}
      >
        <div className="flex size-14 items-center justify-center rounded-full border border-brand-primary/25 bg-brand-primary/10 text-brand-primary">
          <LoaderCircle className="size-6 animate-spin" />
        </div>
      </div>

      <Image
        src="/trainer/about-trainer.jpg"
        alt="გიორგი ლომიძე - AI ტრენერი"
        fill
        priority
        quality={95}
        sizes="(max-width: 640px) 90vw, (max-width: 1024px) 460px, 500px"
        className={cn(
          "object-cover object-center transition-opacity duration-200 ease-out",
          isLoaded ? "opacity-100" : "opacity-0"
        )}
        onLoad={() => setIsLoaded(true)}
      />
    </div>
  );
}
