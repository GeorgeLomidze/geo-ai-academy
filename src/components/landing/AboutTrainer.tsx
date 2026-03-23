import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { TrainerPortrait } from "@/components/landing/TrainerPortrait";

export function AboutTrainer() {
  return (
    <section className="relative overflow-hidden bg-[#141414] py-16 sm:py-20 lg:py-24">
      <div className="absolute inset-0 bg-[#FFD60A]" aria-hidden="true" />
      <div
        className="absolute inset-0 bg-[#0A0A0A] [clip-path:polygon(34%_0,100%_0,100%_100%,48%_100%)] sm:[clip-path:polygon(32%_0,100%_0,100%_100%,45%_100%)] lg:[clip-path:polygon(30%_0,100%_0,100%_100%,43%_100%)]"
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,520px)_1fr] lg:gap-20">
          <div className="flex justify-center lg:justify-start lg:-ml-8">
            <TrainerPortrait />
          </div>

          <div className="max-w-2xl">
            <div className="flex items-center gap-5">
              <span
                className="h-1 w-12 rounded-full bg-[#FFD60A]"
                aria-hidden="true"
              />
              <p className="text-3xl font-bold uppercase text-[#FFD60A] sm:text-4xl">
                მე ვარ გიორგი ლომიძე
              </p>
            </div>

            <h2 className="mt-4 text-4xl font-bold uppercase leading-none text-white sm:text-5xl lg:text-6xl">
              AI ტრენერი
            </h2>

            <p className="mt-8 max-w-xl text-base leading-8 text-[#D1D1D1] sm:text-lg">
              მე ვარ AI ტექნოლოგიების ტრენერი და კონტენტ-კრეატორი. ვეხმარები
              ადამიანებს ხელოვნური ინტელექტის ინსტრუმენტების პრაქტიკულ
              გამოყენებაში - ფოტო, ვიდეო და აუდიო კონტენტის შესაქმნელად.
            </p>

            <Link
              href="/courses"
              className="mt-10 inline-flex items-center rounded-full border border-[#FFD60A] py-2 pl-7 pr-2 text-sm font-semibold text-white transition-colors duration-200 hover:border-[#E6C009] hover:text-[#FFD60A]"
            >
              <span>კურსების ნახვა</span>
              <span className="ml-5 flex size-12 items-center justify-center rounded-full bg-[#FFD60A] text-black">
                <ArrowRight className="size-5" />
              </span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
