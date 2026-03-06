# GEO AI Academy — Learning Platform

## Overview
Online course platform for the Georgian market. Students purchase and complete video courses, while the trainer manages content from an admin dashboard. All UI text must be in Georgian language.

> See `docs/` folder for detailed documentation: sprint prompts, database schema, design system, project structure.

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

## Current Sprint: Sprint 2.5 — Course Reviews & Comments

### Sprint 2.5 Goal
Extend the course system with a complete review feature:
1. Students can leave written reviews on courses
2. Students can rate courses from 1 to 5 with 0.5 steps
3. Each student can leave only one review per course
4. Students can later edit their own review
5. Public course pages display rating summary and reviews
6. Admin can view and moderate reviews from dashboard

### Sprint 2.5 Rules
- Only authenticated users can submit reviews
- Only enrolled students can review a course
- Review text is required
- Rating supports: 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5
- One review per user per course (`@@unique([userId, courseId])`)
- Public users can read reviews but cannot write them
- All UI text, validation messages, and errors must be in Georgian

### NOT in Sprint 2.5
- Instructor replies to reviews
- Review likes/dislikes
- Review attachments/images
- Verified purchase badges beyond enrollment check
- Advanced moderation queues
- Review reporting system

---

## Next.js 16 Critical Rules

### proxy.ts (NOT middleware.ts)
Next.js 16 replaced middleware.ts with proxy.ts. The exported function must be named `proxy`, not `middleware`.

### "use cache" Directive
- Landing page and courses catalog: use "use cache" for static content
- Dashboard, profile, admin pages: do NOT use "use cache" — these are dynamic

### React Compiler
- React Compiler is stable in Next.js 16
- Do NOT manually use useMemo/useCallback — compiler handles memoization automatically

### Turbopack
- Default bundler — no webpack config needed
- Do not add webpack overrides in next.config.ts

---

## Supabase Configuration

### Auth Setup
- Email/Password authentication
- Google OAuth (optional)
- Redirect after login: /dashboard (student) or /admin (admin)

### User Roles
Role field in users table: 'student' | 'admin'
- Default role: 'student'
- Admin role assigned manually from Supabase dashboard

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

# Bunny Stream
BUNNY_STREAM_API_KEY=
BUNNY_STREAM_LIBRARY_ID=
BUNNY_STREAM_CDN_HOSTNAME=
BUNNY_STREAM_TOKEN_AUTH_KEY=
```

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

## Future Sprints (Reference)

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

---

## Documentation Index

| Document | Description |
|---|---|
| `docs/sprint1-prompts.md` | Sprint 1 prompt sequence (skeleton) |
| `docs/sprint2-prompts.md` | Sprint 2 prompt sequence (course system + Bunny Stream) |
| `docs/sprint25-prompts.md` | Sprint 2.5 prompt sequence (reviews & comments) |
| `docs/database-schema.md` | Full Prisma schema for all sprints |
| `docs/design-system.md` | Colors, typography, motion, component guidelines |
| `docs/project-structure.md` | File/folder structure for all sprints |
