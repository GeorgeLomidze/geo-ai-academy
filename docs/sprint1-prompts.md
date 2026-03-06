# Sprint 1 Prompt Sequence

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
- app/(auth)/login/page.tsx: LoginForm component with:
  - Email + password login (Supabase signInWithPassword)
  - Google OAuth button (Supabase signInWithOAuth, provider: 'google')
  - "დავიწყდა პაროლი?" link → /forgot-password
  - "დარეგისტრირდი" link → /register
  - Error handling, redirect to /dashboard on success

- app/(auth)/register/page.tsx: RegisterForm with:
  - Name + email + password + confirm password
  - Google OAuth button
  - Zod validation
  - Supabase signUp, redirect to /dashboard

- app/(auth)/forgot-password/page.tsx: ForgotPasswordForm with:
  - Email input
  - Supabase resetPasswordForEmail
  - Success message: "ბმული გამოგზავნილია თქვენს ელ-ფოსტაზე"

- app/(auth)/reset-password/page.tsx: ResetPasswordForm with:
  - New password + confirm password
  - Supabase updateUser({ password })
  - Redirect to /login on success

All "use client". Beautiful UI. All labels and error messages in Georgian.
Separator between email/password and Google OAuth: "ან"
Google button text: "Google-ით შესვლა"
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
