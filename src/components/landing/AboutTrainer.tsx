import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function AboutTrainer() {
  return (
    <section className="relative overflow-hidden bg-[#141414] py-16 sm:py-20 lg:py-24">
      <div className="absolute inset-0 bg-[#F5A623]" aria-hidden="true" />
      <div
        className="absolute inset-0 bg-[#0A0A0A] [clip-path:polygon(34%_0,100%_0,100%_100%,48%_100%)] sm:[clip-path:polygon(32%_0,100%_0,100%_100%,45%_100%)] lg:[clip-path:polygon(30%_0,100%_0,100%_100%,43%_100%)]"
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,520px)_1fr] lg:gap-20">
          <div className="flex justify-center lg:justify-start lg:-ml-8">
            <div className="relative h-[420px] w-full max-w-[420px] overflow-hidden rounded-xl border border-white/10 shadow-2xl sm:h-[500px] sm:max-w-[460px] lg:h-[540px] lg:max-w-[500px]">
              <Image
                src="/Trainer.jpeg"
                alt="გიორგი ლომიძე — AI ტრენერი"
                fill
                priority
                sizes="(max-width: 640px) 90vw, (max-width: 1024px) 460px, 500px"
                className="object-cover object-center"
              />
            </div>
          </div>

          <div className="max-w-2xl">
            <div className="flex items-center gap-5">
              <span
                className="h-1 w-12 rounded-full bg-[#F5A623]"
                aria-hidden="true"
              />
              <p className="text-3xl font-bold uppercase text-[#F5A623] sm:text-4xl">
                მე ვარ გიორგი ლომიძე
              </p>
            </div>

            <h2 className="mt-4 text-4xl font-bold uppercase leading-none text-white sm:text-5xl lg:text-6xl">
              AI ტრენერი
            </h2>

            <p className="mt-8 max-w-xl text-base leading-8 text-[#D1D1D1] sm:text-lg">
              მე ვარ AI ტექნოლოგიების ტრენერი და კონტენტ-კრეატორი. ვეხმარები
              ადამიანებს ხელოვნური ინტელექტის ინსტრუმენტების პრაქტიკულ
              გამოყენებაში — ფოტო, ვიდეო და აუდიო კონტენტის შესაქმნელად.
            </p>

            <Link
              href="/courses"
              className="mt-10 inline-flex items-center rounded-full border border-[#F5A623] py-2 pl-7 pr-2 text-sm font-semibold text-white transition-colors duration-200 hover:border-[#FFD60A] hover:text-[#FFD60A]"
            >
              <span>კურსების ნახვა</span>
              <span className="ml-5 flex size-12 items-center justify-center rounded-full bg-[#F5A623] text-black">
                <ArrowRight className="size-5" />
              </span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
