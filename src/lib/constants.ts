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
  { label: "მთავარი", href: "/admin" },
  { label: "კურსები", href: "/admin/courses" },
  { label: "სტუდენტები", href: "/admin/students" },
] as const;
