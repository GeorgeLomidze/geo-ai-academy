import { HeroSection } from "@/components/landing/HeroSection";
import { FeaturedCourses } from "@/components/landing/FeaturedCourses";
import { WhyUs } from "@/components/landing/WhyUs";
import { FAQSection } from "@/components/landing/FAQSection";
import { CTASection } from "@/components/landing/CTASection";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <FeaturedCourses />
      <WhyUs />
      <FAQSection />
      <CTASection />
    </>
  );
}
