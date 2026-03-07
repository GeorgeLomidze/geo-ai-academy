export const siteConfig = {
  name: "GEO AI Academy",
  description: "ისწავლე AI ტექნოლოგიები ქართულად",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
} as const;

export const navItems = [
  { label: "მთავარი", href: "/" },
  { label: "კურსები", href: "/courses" },
  { label: "ტრენერი", href: "/about" },
  { label: "კონტაქტი", href: "/#contact" },
] as const;

export const studentNavItems = [
  { label: "სამუშაო პანელი", href: "/dashboard" },
  { label: "ჩემი კურსები", href: "/my-courses" },
  { label: "პროფილი", href: "/profile" },
] as const;

export const socialLinks = [
  {
    label: "Facebook",
    shortLabel: "FB",
    href: "https://facebook.com",
    icon: "facebook",
  },
  {
    label: "YouTube",
    shortLabel: "YT",
    href: "https://youtube.com",
    icon: "youtube",
  },
  {
    label: "TikTok",
    shortLabel: "TK",
    href: "https://tiktok.com",
    icon: "tiktok",
  },
  {
    label: "LinkedIn",
    shortLabel: "LN",
    href: "https://linkedin.com",
    icon: "linkedin",
  },
  {
    label: "Instagram",
    shortLabel: "IN",
    href: "https://instagram.com",
    icon: "instagram",
  },
] as const;

export const adminNavItems = [
  { label: "მიმოხილვა", href: "/admin", icon: "LayoutDashboard" },
  { label: "კურსები", href: "/admin/courses", icon: "BookOpen" },
  { label: "შეფასებები", href: "/admin/reviews", icon: "Star" },
  { label: "სტუდენტები", href: "/admin/students", icon: "Users" },
  { label: "პარამეტრები", href: "/admin/settings", icon: "Settings" },
] as const;
