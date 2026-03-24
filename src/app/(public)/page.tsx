import { HeroSection } from "@/components/landing/HeroSection";
import { FeaturedCourses } from "@/components/landing/FeaturedCourses";
import { AIToolsSection } from "@/components/landing/AIToolsSection";
import { WhyUs } from "@/components/landing/WhyUs";
import { FAQSection } from "@/components/landing/FAQSection";
import { ContactSection } from "@/components/layout/ContactSection";

// Statically cache landing page, revalidate every hour
export const revalidate = 3600;

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <FeaturedCourses />
      <AIToolsSection />
      <WhyUs />
      <FAQSection />
      <ContactSection user={null} />
    </>
  );
}
