export const siteConfig = {
  name: "GEO AI Academy",
  description: "ისწავლე AI ტექნოლოგიები ქართულად",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
} as const;

export const navItems = [
  { label: "მთავარი", href: "/" },
  { label: "კურსები", href: "/courses" },
] as const;

export const adminNavItems = [
  { label: "მიმოხილვა", href: "/admin", icon: "LayoutDashboard" },
  { label: "კურსები", href: "/admin/courses", icon: "BookOpen" },
  { label: "შეფასებები", href: "/admin/reviews", icon: "Star" },
  { label: "სტუდენტები", href: "/admin/students", icon: "Users" },
  { label: "პარამეტრები", href: "/admin/settings", icon: "Settings" },
] as const;
