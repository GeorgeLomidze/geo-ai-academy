import { HeroSection } from "@/components/landing/HeroSection";
import { FeaturedCourses } from "@/components/landing/FeaturedCourses";
import { WhyUs } from "@/components/landing/WhyUs";
import { FAQSection } from "@/components/landing/FAQSection";
import { CTASection } from "@/components/landing/CTASection";
import { ContactSection } from "@/components/layout/ContactSection";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <>
      <HeroSection isAuthenticated={!!user} />
      <FeaturedCourses />
      <WhyUs />
      <FAQSection />
      <CTASection />
      <ContactSection />
    </>
  );
}
