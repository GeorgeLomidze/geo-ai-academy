export const siteConfig = {
  name: "GEO AI Academy",
  description: "ისწავლე AI ტექნოლოგიები ქართულად",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
} as const;

export const navItems = [
  { label: "მთავარი", href: "/" },
  { label: "კურსები", href: "/courses" },
  { label: "AI ინსტრუმენტები", href: "/ai-tools" },
  { label: "ტრენერი", href: "/about" },
  { label: "კონტაქტი", href: "/#contact" },
] as const;

export const aiToolNavItems = [
  {
    label: "სურათის გენერაცია",
    href: "/ai-tools/image",
    emoji: "📷",
    description: "შექმენი ახალი ვიზუალები AI გენერატორით",
  },
  {
    label: "ვიდეოს გენერაცია",
    href: "/ai-tools/video",
    emoji: "🎥",
    description: "ააწყე ვიდეოები ტექსტიდან ან კადრიდან",
  },
  {
    label: "აუდიო გენერაცია",
    href: "/ai-tools/audio",
    emoji: "🎵",
    description: "მუსიკის და აუდიო ეფექტების გენერაცია",
  },
  {
    label: "პროექტები",
    href: "/ai-tools/projects",
    emoji: "📁",
    description: "შექმენი AI პროექტები ნოდების ედიტორით",
  },
] as const;

export const studentNavItems = [
  { label: "სამუშაო პანელი", href: "/dashboard" },
  { label: "ჩემი კურსები", href: "/my-courses" },
  { label: "AI ინსტრუმენტები", href: "/ai-tools" },
  { label: "პროფილი", href: "/profile" },
] as const;

export const socialLinks = [
  {
    label: "Facebook",
    shortLabel: "FB",
    href: "https://www.facebook.com/profile.php?id=61579584744515",
    icon: "facebook",
  },
  {
    label: "YouTube",
    shortLabel: "YT",
    href: "https://www.youtube.com/@GEOAITECH",
    icon: "youtube",
  },
  {
    label: "TikTok",
    shortLabel: "TK",
    href: "https://www.tiktok.com/@george.lomidze0",
    icon: "tiktok",
  },
  {
    label: "LinkedIn",
    shortLabel: "LN",
    href: "https://www.linkedin.com/in/george-lomidze-062b0a366?utm_source=share_via&utm_content=profile&utm_medium=member_ios",
    icon: "linkedin",
  },
  {
    label: "Instagram",
    shortLabel: "IN",
    href: "https://www.instagram.com/giorgilomidze_ai/",
    icon: "instagram",
  },
] as const;

export const adminNavItems = [
  { label: "მიმოხილვა", href: "/admin", icon: "LayoutDashboard" },
  { label: "კურსები", href: "/admin/courses", icon: "BookOpen" },
  { label: "შეკვეთები", href: "/admin/orders", icon: "ShoppingCart" },
  { label: "შეფასებები", href: "/admin/reviews", icon: "Star" },
  { label: "კითხვა-პასუხი", href: "/admin/qa", icon: "MessageSquareText" },
  { label: "სტუდენტები", href: "/admin/students", icon: "Users" },
  { label: "ემაილები", href: "/admin/emails", icon: "Mail" },
  { label: "პარამეტრები", href: "/admin/settings", icon: "Settings" },
] as const;
