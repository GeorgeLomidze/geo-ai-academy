import { HeroSection } from "@/components/landing/HeroSection";
import { FeaturedCourses } from "@/components/landing/FeaturedCourses";
import { AIToolsSection } from "@/components/landing/AIToolsSection";
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
      <AIToolsSection />
      <WhyUs />
      <FAQSection />
      <CTASection />
      <ContactSection
        user={
          user
            ? {
                name:
                  typeof user.user_metadata?.name === "string"
                    ? user.user_metadata.name
                    : "",
                email: user.email ?? "",
              }
            : null
        }
      />
    </>
  );
}
