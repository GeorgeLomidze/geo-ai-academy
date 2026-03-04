# GEO AI Academy — Learning Platform

## Overview
ონლაინ კურსების პლატფორმა ქართული ბაზრისთვის. სტუდენტები ყიდულობენ და გადიან ვიდეო კურსებს, ტრენერი მართავს კონტენტს admin dashboard-იდან.

---

## Tech Stack
- **Framework:** Next.js 16 (App Router, TypeScript, strict mode)
- **Bundler:** Turbopack (default, არ გვჭირდება webpack config)
- **UI:** React 19 + Tailwind CSS 4 + shadcn/ui
- **Auth & DB:** Supabase (PostgreSQL + Auth + Row Level Security)
- **ORM:** Prisma
- **Language:** TypeScript (strict: true, noUncheckedIndexedAccess: true)
- **Validation:** Zod
- **State:** React Context (Zustand მოგვიანებით საჭიროებისას)
- **Deployment target:** Hetzner CPX11 (Docker + Caddy)
- **Node.js:** 20.9+ (Next.js 16 მოთხოვნა)

---

## Current Sprint: Sprint 1 — Skeleton (ჩონჩხი)

### Sprint 1 მიზანი
სამი ძირითადი ნაწილის ჩონჩხის აწყობა:
1. Landing Page (საჯარო)
2. სტუდენტის მხარე (Auth + Dashboard shell)
3. Admin მხარე (Dashboard shell + role guard)

### Sprint 1-ში არ ვაკეთებთ
- ვიდეო player / Bunny Stream integration
- Flitt გადახდა
- კურსის შექმნა/რედაქტირება
- ქვიზები, სერთიფიკატები
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
│   │   │   └── page.tsx                # კურსების კატალოგი (placeholder)
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
Next.js 16-ში middleware.ts ჩანაცვლდა proxy.ts-ით. ექსპორტირებული ფუნქცია უნდა იყოს `proxy`, არა `middleware`.

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
- Landing page და courses catalog: გამოიყენე "use cache" სტატიკური კონტენტისთვის
- Dashboard, profile, admin pages: არ გამოიყენო "use cache" — ეს დინამიური გვერდებია
- Sprint 1-ში ჯერ არ გვჭირდება "use cache", მოგვიანებით დავამატებთ

### React Compiler
- React Compiler stable-ია Next.js 16-ში
- არ გამოიყენო ხელით useMemo/useCallback — compiler ავტომატურად აკეთებს memoization-ს
- გამონაკლისი: თუ performance profiling-ით დაადასტურებ რომ საჭიროა

### Turbopack
- Default bundler — არანაირი webpack config არ გვჭირდება
- next.config.ts-ში არ დაამატო webpack overrides

---

## Supabase Configuration

### Auth Setup
- Email/Password authentication
- Google OAuth (არჩევითი, Sprint 1-ში email საკმარისია)
- Redirect after login: /dashboard (student) ან /admin (admin)

### User Roles
users ცხრილში role ველი: 'student' | 'admin'
- Default role: 'student'
- Admin role ხელით მიენიჭება Supabase dashboard-იდან

### Row Level Security (RLS)
- users: ყველა ხედავს მხოლოდ საკუთარ row-ს
- Sprint 1-ში მინიმალური RLS, შემდეგ Sprint-ებში გავაფართოვებთ

---

## Database Schema (Prisma) — Sprint 1

Sprint 1-ში მხოლოდ ის ცხრილები რომლებიც აუცილებელია:

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

სრული schema (courses, modules, lessons, enrollments, orders...) Sprint 2-ში დაემატება.

---

## Component Guidelines

### General
- ყველა კომპონენტი Server Component by default
- "use client" მხოლოდ: forms, event handlers, useState/useEffect, browser APIs
- shadcn/ui კომპონენტები UI-სთვის (Button, Card, Input, Dialog, etc.)
- Tailwind utility classes სტილისთვის, არ შექმნა ცალკე CSS ფაილები

### Landing Page Components

**HeroSection:**
- სათაური: "ისწავლე AI ტექნოლოგიები ქართულად"
- ქვესათაური: მოკლე აღწერა პლატფორმის შესახებ
- CTA button: "დაიწყე სწავლა" → /register
- Background: gradient ან abstract pattern

**FeaturedCourses:**
- 3 CourseCard კომპონენტი (ჯერ mock data-ით)
- CourseCard: thumbnail, სახელი, მოკლე აღწერა, ფასი, ღილაკი

**WhyUs:**
- 3-4 FeatureCard: icon (lucide-react) + სათაური + აღწერა
- მაგ: "ვიდეო გაკვეთილები", "სერთიფიკატი", "ქართულად", "24/7 წვდომა"

**FAQSection:**
- shadcn/ui Accordion კომპონენტი
- 4-5 ხშირად დასმული კითხვა (mock data)

### Auth Components

**LoginForm:**
- Email + Password inputs
- "დავიწყდა პაროლი" link
- "დარეგისტრირდი" link → /register
- Supabase signInWithPassword

**RegisterForm:**
- სახელი + Email + Password + Password confirm
- Zod validation
- Supabase signUp
- წარმატებით რეგისტრაციის შემდეგ → /dashboard

### Student Dashboard

**Layout:**
- Top navbar: logo, user avatar dropdown (profile, logout)
- Main content area
- Mobile responsive

**Dashboard Page:**
- Welcome message: "გამარჯობა, {name}!"
- ცარიელი state: "ჯერ არ გაქვს კურსები. დაათვალიერე კატალოგი." + CTA button
- ეს Sprint 1-ში placeholder-ია, Sprint 2-ში შეივსება კურსების ბარათებით

**Profile Page:**
- სახელის შეცვლა
- ავატარის URL შეცვლა
- ემაილი (read-only)
- პაროლის შეცვლა

### Admin Dashboard

**Layout:**
- Left sidebar: ნავიგაცია (Overview, Courses, Students, Settings)
- Top bar: admin name, notifications icon, logout
- Main content area

**Overview Page:**
- 4 KPI ბარათი (mock data): სულ სტუდენტები, აქტიური კურსები, შემოსავალი, ახალი რეგისტრაციები
- ცარიელი chart area (placeholder for Recharts)
- ბოლო აქტივობის სია (placeholder)

**Courses Page (placeholder):**
- ცარიელი DataTable shell
- "ახალი კურსის დამატება" ღილაკი (disabled ან placeholder)

**Students Page (placeholder):**
- ცარიელი DataTable shell
- Search input (placeholder)

---

## Skills Setup (პროექტის დაწყებამდე გაუშვი)

### 1. Frontend Design Skill (აუცილებელი)
Anthropic-ის ოფიციალური skill — Claude Code-ს ასწავლის პროფესიონალური UI-ის გენერაციას.
```bash
mkdir -p .claude/skills/frontend-design
curl -o .claude/skills/frontend-design/SKILL.md \
  https://raw.githubusercontent.com/anthropics/claude-code/main/plugins/frontend-design/skills/frontend-design/SKILL.md
```

### 2. UI Skills Pack (რეკომენდებული)
UI-ის პოლირებისთვის — accessibility, motion performance, baseline quality.
```bash
npx ui-skills add baseline-ui
npx ui-skills add fixing-accessibility
npx ui-skills add fixing-motion-performance
```

### 3. სტრუქტურა Skills-ების შემდეგ
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
│   ├── commands/                      ← custom commands (მოგვიანებით)
│   └── settings.json
├── CLAUDE.md                          ← ეს ფაილი
└── ...
```

### Skills-ების გამოყენება
- Landing page-ის აწყობის შემდეგ: "გადახედე landing page-ს frontend-design skill-ით და გააუმჯობესე"
- UI polish: "გაუშვი baseline-ui skill ყველა კომპონენტზე"
- Accessibility: "შეამოწმე accessibility fixing-accessibility skill-ით"

---

## Styling & Design System

### Brand Identity
- **სახელი:** GEO AI Academy
- **პოზიციონირება:** Modern, tech-forward, ქართული
- **განწყობა:** Professional მაგრამ approachable, AI/tech ასოციაცია

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
- ქართული ტექსტი კარგად მუშაობს ორივე ფონტთან

### Design Principles
- **არა generic AI დიზაინი** — distinctive, memorable, professional
- ბევრი whitespace — 8px grid system (p-2, p-4, p-6, p-8)
- Rounded corners: rounded-2xl on cards, rounded-xl on buttons
- Shadows: shadow-sm default, shadow-lg on hover (elevation change)
- Purple brand color dominant, emerald for action/CTA

### Motion & Animations
- **Page load:** staggered reveal — elements fade-in sequentially (animation-delay)
- **Cards:** hover:translate-y-[-4px] + hover:shadow-xl (lift effect)
- **Buttons:** scale-[1.02] on hover, smooth transition-all duration-200
- **Sections:** fade-in-up on scroll (Framer Motion / CSS intersection observer)
- **Page transitions:** subtle opacity + translateY
- **არ გადააჭარბო** — 1-2 ანიმაცია per component max

### Landing Page Design Direction
- **Hero:** full-width, gradient background (purple→dark), large bold headline, animated particles ან abstract shapes (CSS only), floating CTA button
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
- **Empty states:** illustration ან icon + descriptive text + CTA
- **Profile:** clean form layout, card container

---

## Naming Conventions
- ფაილები: kebab-case (hero-section.tsx არა, კომპონენტებისთვის PascalCase: HeroSection.tsx)
- კომპონენტები: PascalCase
- ფუნქციები: camelCase
- ცვლადები: camelCase
- Types/Interfaces: PascalCase, prefix "I" არ გამოიყენო
- Database columns: camelCase (Prisma convention)
- API routes: kebab-case (/api/auth/callback)
- CSS classes: Tailwind utilities only

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

Sprint 2-ში დაემატება: BUNNY_API_KEY, BUNNY_LIBRARY_ID, FLITT_MERCHANT_ID, FLITT_SECRET_KEY

---

## Off-Limits (არ გააკეთო)
- არასოდეს `any` ტიპი
- არასოდეს inline styles (style={{}})
- არასოდეს console.log production კოდში (dev-only)
- არ შექმნა ცალკე .css ფაილები (Tailwind only, გარდა globals.css)
- არ გამოიყენო Pages Router — მხოლოდ App Router
- არ გამოიყენო middleware.ts — Next.js 16-ში proxy.ts-ია
- არ გამოიყენო webpack config — Turbopack default-ია
- არ გამოიყენო ხელით useMemo/useCallback — React Compiler handles it
- არ დააინსტალირო axios — fetch API + Next.js caching
- არ დააინსტალირო moment.js — date-fns ან built-in Intl
- არ გამოიყენო default export API routes-ში — named exports (GET, POST)

---

## Sprint 1 Prompt Sequence

ეს არის Claude Code-ისთვის რეკომენდებული prompt-ების თანმიმდევრობა:

### Prompt 0: Skills Setup (ერთჯერადი)
```
გაუშვი ეს ბრძანებები skills-ების დასაყენებლად:
mkdir -p .claude/skills/frontend-design
curl -o .claude/skills/frontend-design/SKILL.md https://raw.githubusercontent.com/anthropics/claude-code/main/plugins/frontend-design/skills/frontend-design/SKILL.md
npx ui-skills add baseline-ui
npx ui-skills add fixing-accessibility
npx ui-skills add fixing-motion-performance
```

### Prompt 1: Project Init
```
შექმენი Next.js 16 პროექტი "geo-ai-academy" სახელით.
გაუშვი: npx create-next-app@latest geo-ai-academy --typescript --tailwind --app --src-dir --import-alias "@/*"
შემდეგ: დააინსტალირე shadcn/ui (npx shadcn@latest init), prisma, @supabase/ssr, @supabase/supabase-js, zod, framer-motion.
shadcn/ui კომპონენტებიდან დაამატე: button, card, input, label, accordion, avatar, dropdown-menu, separator, badge.
დააკონფიგურირე tailwind.config.ts CLAUDE.md-ში აღწერილი ფერებით (primary, secondary, accent, და ა.შ.).
დაამატე ორი font next/font/google-ით: Space Grotesk (headings) და Inter (body).
შექმენი .env.local ფაილი CLAUDE.md-ის environment variables სექციის მიხედვით.
```

### Prompt 2: Supabase + Auth + Proxy
```
დააკონფიგურირე Supabase:
- lib/supabase/client.ts (browser client)
- lib/supabase/server.ts (server client with cookies)
- app/api/auth/callback/route.ts (OAuth callback)
- proxy.ts: auth guard — /dashboard/*, /profile/*, /admin/* routes-ზე ამოწმებს session-ს. თუ არ არის authenticated, redirect /login-ზე. /admin/* routes-ზე ამოწმებს role === 'admin'.
```

### Prompt 3: Prisma Schema
```
შექმენი prisma/schema.prisma Sprint 1 schema-ით (User model + Role enum).
DATABASE_URL Supabase PostgreSQL connection string-ით.
გაუშვი: npx prisma generate
```

### Prompt 4: Layouts
```
შექმენი layouts:
- app/layout.tsx: root layout, Inter font, metadata
- app/(public)/layout.tsx: Navbar + Footer
- app/(auth)/layout.tsx: centered, minimal, logo on top
- app/(student)/layout.tsx: Navbar (with user menu) + main content
- app/(admin)/admin/layout.tsx: AdminSidebar + AdminTopbar + main content

Navbar: logo "GEO AI Academy", nav links (მთავარი, კურსები, შესვლა/რეგისტრაცია). თუ authenticated: Dashboard link + Avatar dropdown.
AdminSidebar: Overview, კურსები, სტუდენტები, პარამეტრები. Collapsible on mobile.
Footer: მარტივი — copyright + social links placeholders.
```

### Prompt 5: Landing Page
```
შექმენი app/(public)/page.tsx — Landing page. გამოიყენე frontend-design skill-ის პრინციპები.
კომპონენტები:
- HeroSection: სათაური "ისწავლე AI ტექნოლოგიები ქართულად" (Space Grotesk, bold, large), ქვესათაური, CTA button "დაიწყე სწავლა" → /register (accent color), gradient background (purple→dark). staggered fade-in ანიმაცია (framer-motion).
- FeaturedCourses: 3 CourseCard mock data-ით (AI Content Creation, ვებ დეველოპმენტი, Prompt Engineering). Cards: rounded-2xl, hover lift effect, shadow-lg on hover, price badge.
- WhyUs: 4 FeatureCard lucide icons-ით, icon primary-light background-ით. Fade-in-up on scroll.
- FAQSection: shadcn Accordion, 5 კითხვა ქართულად, purple accent on active.
ყველაფერი responsive, mobile-first. არა generic — distinctive და professional.
```

### Prompt 6: Auth Pages
```
შექმენი auth გვერდები:
- app/(auth)/login/page.tsx: LoginForm კომპონენტით (email + password, Supabase signInWithPassword, error handling, redirect to /dashboard)
- app/(auth)/register/page.tsx: RegisterForm (name + email + password + confirm, Zod validation, Supabase signUp)
ორივე "use client". ლამაზი UI, ქართული labels.
```

### Prompt 7: Student Pages
```
შექმენი სტუდენტის გვერდები:
- app/(student)/dashboard/page.tsx: Welcome message (user name-ით), empty state "ჯერ არ გაქვს კურსები", CTA → /courses
- app/(student)/profile/page.tsx: profile edit form (name, avatar URL, password change), Zod validation, Server Action for update
```

### Prompt 8: Admin Pages
```
შექმენი admin გვერდები:
- app/(admin)/admin/page.tsx: Overview — 4 StatsCard (mock numbers), icon + colored background, big number, trend arrow. Empty chart placeholder, recent activity placeholder.
- app/(admin)/admin/courses/page.tsx: placeholder DataTable shell, "ახალი კურსი" disabled button
- app/(admin)/admin/students/page.tsx: placeholder DataTable shell, search input
Admin sidebar: dark theme (secondary color), active item primary highlight.
ყველაფერი ქართულად.
```

### Prompt 9: Design Polish Pass
```
გადახედე მთელ აპლიკაციას frontend-design skill-ის პრინციპებით და გააუმჯობესე:
1. Landing page: შეამოწმე ანიმაციები, spacing, hover effects, typography hierarchy
2. Auth pages: ლამაზი centered layout, subtle animations
3. Student dashboard: welcoming empty state, consistent card design
4. Admin dashboard: professional data-focused design, sidebar polish
5. გაუშვი baseline-ui skill ყველა page-ზე
6. შეამოწმე accessibility (fixing-accessibility skill)
7. შეამოწმე motion performance (fixing-motion-performance skill)
8. Mobile responsiveness ყველა გვერდზე
```

---

## Future Sprints (Reference)

### Sprint 2: კურსის სისტემა
- Prisma schema expansion (courses, modules, lessons, enrollments)
- Bunny Stream integration (video upload + signed URL)
- Course creation in admin
- Course catalog with real data
- /learn/[slug]/[lessonId] page with video player

### Sprint 3: გადახდა და გაყიდვები
- Flitt payment integration (API + webhook)
- Checkout flow
- Order management in admin
- Sales analytics (Recharts)

### Sprint 4: ბონუს ფუნქციები
- ქვიზები
- სერთიფიკატები (PDF generation)
- კუპონები / ფასდაკლებები
- Email notifications (Resend)
- SEO optimization ("use cache", metadata, sitemap)