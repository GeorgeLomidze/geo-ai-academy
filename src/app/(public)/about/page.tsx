import { AboutTrainer } from "@/components/landing/AboutTrainer";

export const revalidate = 86400;

export const metadata = {
  title: "ტრენერი - GEO AI Academy",
  description: "გაიცანი GEO AI Academy-ის ტრენერი გიორგი ლომიძე.",
};

export default function AboutPage() {
  return <AboutTrainer />;
}
