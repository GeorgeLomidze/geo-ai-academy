# GEO AI Academy — Learning Platform

## Overview
Online course platform for the Georgian market. Students purchase and complete video courses, while the trainer manages content from an admin dashboard. All UI text must be in Georgian language.

---

## Tech Stack
- **Framework:** Next.js 16 (App Router, TypeScript, strict mode)
- **Bundler:** Turbopack (default, no webpack config needed)
- **UI:** React 19 + Tailwind CSS 4 + shadcn/ui
- **Auth & DB:** Supabase (PostgreSQL + Auth + Row Level Security)
- **ORM:** Prisma
- **Language:** TypeScript (strict: true, noUncheckedIndexedAccess: true)
- **Validation:** Zod
- **State:** React Context (Zustand later if needed)
- **Deployment target:** Hetzner CPX11 (Docker + Caddy)
- **Node.js:** 20.9+ (Next.js 16 requirement)

---

## Current Sprint: Sprint 1 — Skeleton

### Sprint 1 Goal
Build the skeleton of three core sections:
1. Landing Page (public)
2. Student side (Auth + Dashboard shell)
3. Admin side (Dashboard shell + role guard)

### NOT in Sprint 1
- Video player / Bunny Stream integration
- Flitt payments
- Course creation/editing
- Quizzes, certificates
- Email notifications
- SEO optimization

---

## Project Structure

```
geo-ai-academy/
├── app/
│   ├── (public)/
│   │   ├── page.tsx                    # Landing page
│   │   ├── courses/
│   │   │   └── page.tsx                # Course catalog (placeholder)
│   │   └── layout.tsx                  # Public layout (navbar + footer)
│   │
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx                # Login page
│   │   ├── register/
│   │   │   └── page.tsx                # Register page
│   │   └── layout.tsx                  # Auth layout (centered, minimal)
│   │
│   ├── (student)/
│   │   ├── dashboard/
│   │   │   └── page.tsx                # Student dashboard
│   │   ├── profile/
│   │   │   └── page.tsx                # Profile page
│   │   └── layout.tsx                  # Student layout (navbar + sidebar)
│   │
│   ├── (admin)/
│   │   ├── admin/
│   │   │   ├── page.tsx                # Admin overview dashboard
│   │   │   ├── courses/
│   │   │   │   └── page.tsx            # Course management (placeholder)
│   │   │   └── students/
│   │   │       └── page.tsx            # Students list (placeholder)
│   │   └── layout.tsx                  # Admin layout (sidebar + topbar)
│   │
│   ├── api/
│   │   └── auth/
│   │       └── callback/
│   │           └── route.ts            # Supabase OAuth callback
│   │
│   ├── layout.tsx                      # Root layout
│   └── globals.css                     # Tailwind globals
│
├── components/
│   ├── ui/                             # shadcn/ui components
│   ├── landing/
│   │   ├── HeroSection.tsx
│   │   ├── FeaturedCourses.tsx
│   │   ├── WhyUs.tsx
│   │   └── FAQSection.tsx
│   ├── layout/
│   │   ├── Navbar.tsx                  # Public navbar
│   │   ├── Footer.tsx
│   │   ├── StudentSidebar.tsx
│   │   ├── AdminSidebar.tsx
│   │   └── AdminTopbar.tsx
│   └── auth/
│       ├── LoginForm.tsx
│       └── RegisterForm.tsx
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts                   # Browser client
│   │   ├── server.ts                   # Server client
│   │   └── middleware.ts               # Auth helper for proxy.ts
│   ├── utils.ts                        # cn() helper, general utils
│   └── constants.ts                    # Site config, navigation items
│
├── prisma/
│   └── schema.prisma                   # Database schema
│
├── proxy.ts                            # Next.js 16 proxy (replaces middleware.ts)
├── tailwind.config.ts
├── next.config.ts
├── CLAUDE.md                           # This file
└── package.json
```

---

## Next.js 16 Critical Rules

### proxy.ts (NOT middleware.ts)
Next.js 16 replaced middleware.ts with proxy.ts. The exported function must be named `proxy`, not `middleware`.

```typescript
// proxy.ts
import { NextRequest, NextResponse } from 'next/server'

export function proxy(request: NextRequest) {
  // auth check logic here
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/profile/:path*']
}
```

### "use cache" Directive
- Landing page and courses catalog: use "use cache" for static content
- Dashboard, profile, admin pages: do NOT use "use cache" — these are dynamic
- Not needed in Sprint 1, will add later

### React Compiler
- React Compiler is stable in Next.js 16
- Do NOT manually use useMemo/useCallback — compiler handles memoization automatically
- Exception: only if performance profiling proves it necessary

### Turbopack
- Default bundler — no webpack config needed
- Do not add webpack overrides in next.config.ts

---

## Supabase Configuration

### Auth Setup
- Email/Password authentication
- Google OAuth (optional, email is enough for Sprint 1)
- Redirect after login: /dashboard (student) or /admin (admin)

### User Roles
Role field in users table: 'student' | 'admin'
- Default role: 'student'
- Admin role assigned manually from Supabase dashboard

### Row Level Security (RLS)
- users: each user can only see their own row
- Minimal RLS in Sprint 1, will expand in later Sprints

---

## Database Schema (Prisma) — Sprint 1

Only the tables that are essential for Sprint 1:

```prisma
model User {
  id            String    @id @default(uuid())
  email         String    @unique
  name          String?
  avatarUrl     String?
  role          Role      @default(STUDENT)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

enum Role {
  STUDENT
  ADMIN
}
```

Full schema (courses, modules, lessons, enrollments, orders...) will be added in Sprint 2.

---

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
- CTA button: "დაიწყე სწავლა" → /register
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
- "დარეგისტრირდი" link → /register
- Supabase signInWithPassword
- All labels in Georgian

**RegisterForm:**
- Name + Email + Password + Password confirm
- Zod validation
- Supabase signUp
- After successful registration → /dashboard
- All labels and error messages in Georgian

### Student Dashboard

**Layout:**
- Top navbar: logo, user avatar dropdown (profile, logout)
- Main content area
- Mobile responsive

**Dashboard Page:**
- Welcome message: "გამარჯობა, {name}!"
- Empty state: "ჯერ არ გაქვს კურსები. დაათვალიერე კატალოგი." + CTA button
- This is a placeholder in Sprint 1, will be filled with course cards in Sprint 2

**Profile Page:**
- Edit name
- Edit avatar URL
- Email (read-only)
- Change password
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

**Courses Page (placeholder):**
- Empty DataTable shell
- "ახალი კურსის დამატება" button (disabled or placeholder)

**Students Page (placeholder):**
- Empty DataTable shell
- Search input (placeholder)

---

## Skills Setup (run before starting the project)

### 1. Frontend Design Skill (required)
Anthropic's official skill — teaches Claude Code to generate professional UI.
```bash
mkdir -p .claude/skills/frontend-design
curl -o .claude/skills/frontend-design/SKILL.md \
  https://raw.githubusercontent.com/anthropics/claude-code/main/plugins/frontend-design/skills/frontend-design/SKILL.md
```

### 2. UI Skills Pack (recommended)
For UI polishing — accessibility, motion performance, baseline quality.
```bash
npx ui-skills add baseline-ui
npx ui-skills add fixing-accessibility
npx ui-skills add fixing-motion-performance
```

### 3. Structure after Skills installation
```
geo-ai-academy/
├── .claude/
│   ├── skills/
│   │   ├── frontend-design/
│   │   │   └── SKILL.md              ← Anthropic design skill
│   │   ├── baseline-ui/
│   │   │   └── SKILL.md              ← UI polish
│   │   ├── fixing-accessibility/
│   │   │   └── SKILL.md              ← a11y fixes
│   │   └── fixing-motion-performance/
│   │       └── SKILL.md              ← animation perf
│   ├── commands/                      ← custom commands (later)
│   └── settings.json
├── CLAUDE.md                          ← this file
└── ...
```

### How to use Skills
- After building landing page: "Review the landing page using frontend-design skill principles and improve it"
- UI polish: "Run baseline-ui skill on all components"
- Accessibility: "Check accessibility using fixing-accessibility skill"

---

## Styling & Design System

### Brand Identity
- **Name:** GEO AI Academy
- **Positioning:** Modern, tech-forward, Georgian
- **Mood:** Professional but approachable, AI/tech association

### Colors (Tailwind Config)
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

### Typography
- **Display font:** Space Grotesk (Google Fonts, next/font) — headings, hero, brand
- **Body font:** Inter (Google Fonts, next/font) — body text, UI elements
- Scale: text-sm (14px), text-base (16px), text-lg (18px), text-xl–text-5xl headings
- Georgian text works well with both fonts

### Design Principles
- **No generic AI design** — distinctive, memorable, professional
- Generous whitespace — 8px grid system (p-2, p-4, p-6, p-8)
- Rounded corners: rounded-2xl on cards, rounded-xl on buttons
- Shadows: shadow-sm default, shadow-lg on hover (elevation change)
- Purple brand color dominant, emerald for action/CTA

### Motion & Animations
- **Page load:** staggered reveal — elements fade-in sequentially (animation-delay)
- **Cards:** hover:translate-y-[-4px] + hover:shadow-xl (lift effect)
- **Buttons:** scale-[1.02] on hover, smooth transition-all duration-200
- **Sections:** fade-in-up on scroll (Framer Motion / CSS intersection observer)
- **Page transitions:** subtle opacity + translateY
- **Do not overdo it** — 1-2 animations per component max

### Landing Page Design Direction
- **Hero:** full-width, gradient background (purple→dark), large bold headline, animated particles or abstract shapes (CSS only), floating CTA button
- **Course Cards:** thumbnail top, rounded-2xl, shadow on hover, price badge, category tag
- **WhyUs Section:** icon circles with primary-light background, centered layout
- **FAQ:** clean accordion, purple accent on active item
- **Footer:** dark background (secondary color), grid layout

### Admin Dashboard Design Direction
- **Sidebar:** dark theme (secondary color), active item with primary highlight
- **KPI Cards:** white surface, icon with colored background, big number, trend indicator
- **Tables:** clean, zebra-striping optional, rounded container
- **Overall:** professional, data-focused, minimal decoration

### Student Portal Design Direction
- **Dashboard:** welcoming, card-based, progress bars with primary gradient
- **Empty states:** illustration or icon + descriptive text + CTA
- **Profile:** clean form layout, card container

---

## Naming Conventions
- Files: PascalCase for components (HeroSection.tsx), kebab-case for utils
- Components: PascalCase
- Functions: camelCase
- Variables: camelCase
- Types/Interfaces: PascalCase, do NOT use "I" prefix
- Database columns: camelCase (Prisma convention)
- API routes: kebab-case (/api/auth/callback)
- CSS classes: Tailwind utilities only

---

## Language Rules
- **All UI text must be in Georgian** — buttons, labels, headings, descriptions, error messages, placeholders
- **Code is in English** — variable names, function names, component names, comments
- **CLAUDE.md is in English** — for better Claude Code comprehension
- Example: component named `LoginForm` with Georgian label "ელ-ფოსტა" for email field

---

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Database
DATABASE_URL=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME="GEO AI Academy"
```

Sprint 2 will add: BUNNY_API_KEY, BUNNY_LIBRARY_ID, FLITT_MERCHANT_ID, FLITT_SECRET_KEY

---

## Off-Limits (do NOT do these)
- Never use `any` type
- Never use inline styles (style={{}})
- Never use console.log in production code (dev-only)
- Do not create separate .css files (Tailwind only, except globals.css)
- Do not use Pages Router — App Router only
- Do not use middleware.ts — Next.js 16 uses proxy.ts
- Do not use webpack config — Turbopack is default
- Do not manually use useMemo/useCallback — React Compiler handles it
- Do not install axios — use fetch API + Next.js caching
- Do not install moment.js — use date-fns or built-in Intl
- Do not use default exports in API routes — use named exports (GET, POST)

---

## Sprint 1 Prompt Sequence

Recommended prompt sequence for Claude Code:

### Prompt 0: Skills Setup (one-time)
```
Run these commands to install skills:
mkdir -p .claude/skills/frontend-design
curl -o .claude/skills/frontend-design/SKILL.md https://raw.githubusercontent.com/anthropics/claude-code/main/plugins/frontend-design/skills/frontend-design/SKILL.md
npx ui-skills add baseline-ui
npx ui-skills add fixing-accessibility
npx ui-skills add fixing-motion-performance
```

### Prompt 1: Project Init
```
Create a Next.js 16 project named "geo-ai-academy".
Run: npx create-next-app@latest geo-ai-academy --typescript --tailwind --app --src-dir --import-alias "@/*"
Then install: shadcn/ui (npx shadcn@latest init), prisma, @supabase/ssr, @supabase/supabase-js, zod, framer-motion.
Add these shadcn/ui components: button, card, input, label, accordion, avatar, dropdown-menu, separator, badge.
Configure tailwind.config.ts with colors from CLAUDE.md (primary, secondary, accent, etc.).
Add two fonts via next/font/google: Space Grotesk (headings) and Inter (body).
Create .env.local file per CLAUDE.md environment variables section.
```

### Prompt 2: Supabase + Auth + Proxy
```
Configure Supabase:
- lib/supabase/client.ts (browser client)
- lib/supabase/server.ts (server client with cookies)
- app/api/auth/callback/route.ts (OAuth callback)
- proxy.ts: auth guard — check session on /dashboard/*, /profile/*, /admin/* routes. If not authenticated, redirect to /login. On /admin/* routes, also check role === 'admin'.
```

### Prompt 3: Prisma Schema
```
Create prisma/schema.prisma with Sprint 1 schema (User model + Role enum).
DATABASE_URL uses Supabase PostgreSQL connection string.
Run: npx prisma generate
```

### Prompt 4: Layouts
```
Create layouts:
- app/layout.tsx: root layout, Inter font, metadata
- app/(public)/layout.tsx: Navbar + Footer
- app/(auth)/layout.tsx: centered, minimal, logo on top
- app/(student)/layout.tsx: Navbar (with user menu) + main content
- app/(admin)/admin/layout.tsx: AdminSidebar + AdminTopbar + main content

Navbar: logo "GEO AI Academy", nav links (მთავარი, კურსები, შესვლა/რეგისტრაცია). If authenticated: Dashboard link + Avatar dropdown.
AdminSidebar: მიმოხილვა, კურსები, სტუდენტები, პარამეტრები. Collapsible on mobile.
Footer: simple — copyright + social links placeholders.
All navigation text in Georgian.
```

### Prompt 5: Landing Page
```
Create app/(public)/page.tsx — Landing page. Apply frontend-design skill principles.
Components:
- HeroSection: title "ისწავლე AI ტექნოლოგიები ქართულად" (Space Grotesk, bold, large), subtitle in Georgian, CTA button "დაიწყე სწავლა" → /register (accent color), gradient background (purple→dark). Staggered fade-in animation (framer-motion).
- FeaturedCourses: 3 CourseCard with mock data (AI Content Creation, ვებ დეველოპმენტი, Prompt Engineering). Cards: rounded-2xl, hover lift effect, shadow-lg on hover, price badge.
- WhyUs: 4 FeatureCard with lucide icons, icon on primary-light background. Fade-in-up on scroll.
- FAQSection: shadcn Accordion, 5 questions in Georgian, purple accent on active.
Everything responsive, mobile-first. Not generic — distinctive and professional.
All text in Georgian.
```

### Prompt 6: Auth Pages
```
Create auth pages:
- app/(auth)/login/page.tsx: LoginForm component (email + password, Supabase signInWithPassword, error handling, redirect to /dashboard)
- app/(auth)/register/page.tsx: RegisterForm (name + email + password + confirm, Zod validation, Supabase signUp)
Both "use client". Beautiful UI. All labels and error messages in Georgian.
```

### Prompt 7: Student Pages
```
Create student pages:
- app/(student)/dashboard/page.tsx: Welcome message with user name ("გამარჯობა, {name}!"), empty state "ჯერ არ გაქვს კურსები", CTA → /courses
- app/(student)/profile/page.tsx: profile edit form (name, avatar URL, password change), Zod validation, Server Action for update
All text in Georgian.
```

### Prompt 8: Admin Pages
```
Create admin pages:
- app/(admin)/admin/page.tsx: Overview — 4 StatsCard (mock numbers), icon + colored background, big number, trend arrow. Empty chart placeholder, recent activity placeholder.
- app/(admin)/admin/courses/page.tsx: placeholder DataTable shell, "ახალი კურსი" disabled button
- app/(admin)/admin/students/page.tsx: placeholder DataTable shell, search input
Admin sidebar: dark theme (secondary color), active item primary highlight.
All text in Georgian.
```

### Prompt 9: Design Polish Pass
```
Review the entire application using frontend-design skill principles and improve:
1. Landing page: check animations, spacing, hover effects, typography hierarchy
2. Auth pages: beautiful centered layout, subtle animations
3. Student dashboard: welcoming empty state, consistent card design
4. Admin dashboard: professional data-focused design, sidebar polish
5. Run baseline-ui skill on all pages
6. Check accessibility (fixing-accessibility skill)
7. Check motion performance (fixing-motion-performance skill)
8. Mobile responsiveness on all pages
```

---

## Future Sprints (Reference)

### Sprint 2: Course System
- Prisma schema expansion (courses, modules, lessons, enrollments)
- Bunny Stream integration (video upload + signed URL)
- Course creation in admin
- Course catalog with real data
- /learn/[slug]/[lessonId] page with video player

### Sprint 3: Payments & Sales
- Flitt payment integration (API + webhook)
- Checkout flow
- Order management in admin
- Sales analytics (Recharts)

### Sprint 4: Bonus Features
- Quizzes
- Certificates (PDF generation)
- Coupons / discounts
- Email notifications (Resend)
- SEO optimization ("use cache", metadata, sitemap)