# Design System

## Brand Identity
- **Name:** GEO AI Academy
- **Positioning:** Modern, tech-forward, Georgian
- **Mood:** Professional but approachable, AI/tech association

## Colors (Tailwind Config)
```
primary:       #6C3CE1  (purple — brand, nav, buttons, links)
primary-hover: #5B2BD0  (darker purple — hover states)
primary-light: #F0EAFF  (light purple — backgrounds, badges)
secondary:     #0F0A1A  (near-black — headings, dark sections)
accent:        #10B981  (emerald — CTA buttons, success, pricing)
accent-hover:  #059669  (darker emerald — hover)
warning:       #F59E0B  (amber — alerts, badges)
danger:        #EF4444  (red — errors, destructive actions)
background:    #FAFAFE  (off-white — page background)
surface:       #FFFFFF  (white — cards, panels)
border:        #E5E7EB  (gray-200 — dividers, borders)
muted:         #6B7280  (gray-500 — secondary text, placeholders)
```

## Typography
- **Display font:** Space Grotesk (Google Fonts, next/font) — headings, hero, brand
- **Body font:** Inter (Google Fonts, next/font) — body text, UI elements
- Scale: text-sm (14px), text-base (16px), text-lg (18px), text-xl-text-5xl headings
- Georgian text works well with both fonts

## Design Principles
- **No generic AI design** — distinctive, memorable, professional
- Generous whitespace — 8px grid system (p-2, p-4, p-6, p-8)
- Rounded corners: rounded-2xl on cards, rounded-xl on buttons
- Shadows: shadow-sm default, shadow-lg on hover (elevation change)
- Purple brand color dominant, emerald for action/CTA

## Motion & Animations
- **Page load:** staggered reveal — elements fade-in sequentially (animation-delay)
- **Cards:** hover:translate-y-[-4px] + hover:shadow-xl (lift effect)
- **Buttons:** scale-[1.02] on hover, smooth transition-all duration-200
- **Sections:** fade-in-up on scroll (Framer Motion / CSS intersection observer)
- **Page transitions:** subtle opacity + translateY
- **Do not overdo it** — 1-2 animations per component max

## Landing Page Design Direction
- **Hero:** full-width, gradient background (purple->dark), large bold headline, animated particles or abstract shapes (CSS only), floating CTA button
- **Course Cards:** thumbnail top, rounded-2xl, shadow on hover, price badge, category tag
- **WhyUs Section:** icon circles with primary-light background, centered layout
- **FAQ:** clean accordion, purple accent on active item
- **Footer:** dark background (secondary color), grid layout

## Admin Dashboard Design Direction
- **Sidebar:** dark theme (secondary color), active item with primary highlight
- **KPI Cards:** white surface, icon with colored background, big number, trend indicator
- **Tables:** clean, zebra-striping optional, rounded container
- **Overall:** professional, data-focused, minimal decoration

## Student Portal Design Direction
- **Dashboard:** welcoming, card-based, progress bars with primary gradient
- **Empty states:** illustration or icon + descriptive text + CTA
- **Profile:** clean form layout, card container

## Component Guidelines

### General
- All components are Server Components by default
- "use client" only for: forms, event handlers, useState/useEffect, browser APIs
- Use shadcn/ui components for UI (Button, Card, Input, Dialog, etc.)
- Tailwind utility classes for styling, do not create separate CSS files

### Landing Page Components

**HeroSection:**
- Title: "ისწავლე AI ტექნოლოგიები ქართულად"
- Subtitle: short description about the platform in Georgian
- CTA button: "დაიწყე სწავლა" -> /register
- Background: gradient or abstract pattern

**FeaturedCourses:**
- 3 CourseCard components (mock data for now)
- CourseCard: thumbnail, name, short description, price, button
- All text in Georgian

**WhyUs:**
- 3-4 FeatureCard: icon (lucide-react) + title + description
- Examples: "ვიდეო გაკვეთილები", "სერთიფიკატი", "ქართულად", "24/7 წვდომა"

**FAQSection:**
- shadcn/ui Accordion component
- 4-5 frequently asked questions (mock data, in Georgian)

### Auth Components

**LoginForm:**
- Email + Password inputs
- "დავიწყდა პაროლი" link
- "დარეგისტრირდი" link -> /register
- Supabase signInWithPassword
- All labels in Georgian

**RegisterForm:**
- Name + Email + Password + Password confirm
- Zod validation
- Supabase signUp
- After successful registration -> /dashboard
- All labels and error messages in Georgian

### Student Dashboard

**Layout:**
- Top navbar: logo, user avatar dropdown (profile, logout)
- Main content area
- Mobile responsive

**Dashboard Page:**
- Welcome message: "გამარჯობა, {name}!"
- Empty state: "ჯერ არ გაქვს კურსები. დაათვალიერე კატალოგი." + CTA button

**Profile Page:**
- Edit name, avatar URL, email (read-only), change password
- All labels in Georgian

### Admin Dashboard

**Layout:**
- Left sidebar: navigation (მიმოხილვა, კურსები, სტუდენტები, პარამეტრები)
- Top bar: admin name, notifications icon, logout
- Main content area

**Overview Page:**
- 4 KPI cards (mock data): total students, active courses, revenue, new registrations
- Empty chart area (placeholder for Recharts)
- Recent activity list (placeholder)
- All labels in Georgian
