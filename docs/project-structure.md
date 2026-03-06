# Project Structure

## Sprint 1 — Base Structure

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
├── CLAUDE.md                           # Project instructions
└── package.json
```

---

## Sprint 2 Additions

```
app/
├── (public)/
│   ├── courses/
│   │   ├── page.tsx                    # Course catalog (real data)
│   │   └── [slug]/
│   │       └── page.tsx                # Course detail page
│
├── (student)/
│   ├── learn/
│   │   └── [slug]/
│   │       ├── page.tsx                # Course overview / module list
│   │       └── [lessonId]/
│   │           └── page.tsx            # Lesson viewer (video or text)
│   ├── my-courses/
│   │   └── page.tsx                    # Enrolled courses list
│
├── (admin)/
│   ├── admin/
│   │   ├── courses/
│   │   │   ├── page.tsx                # Course list (DataTable)
│   │   │   ├── new/
│   │   │   │   └── page.tsx            # Create new course
│   │   │   └── [courseId]/
│   │   │       ├── page.tsx            # Edit course details
│   │   │       ├── modules/
│   │   │       │   └── page.tsx        # Module & lesson management
│   │   │       └── settings/
│   │   │           └── page.tsx        # Course settings (status, price)
│
├── api/
│   ├── courses/
│   │   └── route.ts                    # GET courses list
│   ├── admin/
│   │   ├── courses/
│   │   │   └── route.ts               # POST create, GET admin list
│   │   ├── courses/[courseId]/
│   │   │   └── route.ts               # PUT update, DELETE course
│   │   ├── modules/
│   │   │   └── route.ts               # POST create, PUT reorder
│   │   ├── lessons/
│   │   │   └── route.ts               # POST create, PUT update
│   │   └── upload/
│   │       └── route.ts               # Video upload to Bunny Stream
│   ├── enroll/
│   │   └── route.ts                   # POST enroll in course
│   └── progress/
│       └── route.ts                   # POST update lesson progress

components/
├── course/
│   ├── CourseCard.tsx                  # Catalog card
│   ├── CourseGrid.tsx                  # Grid layout for catalog
│   ├── CourseDetail.tsx               # Course detail header
│   ├── ModuleAccordion.tsx            # Module list with lessons
│   └── PriceTag.tsx                   # Price display with GEL symbol
├── learn/
│   ├── VideoPlayer.tsx                # Bunny Stream iframe player
│   ├── TextLesson.tsx                 # Rich text lesson viewer
│   ├── LessonSidebar.tsx             # Module/lesson navigation
│   └── ProgressBar.tsx               # Course progress indicator
├── admin/
│   ├── CourseForm.tsx                 # Course create/edit form
│   ├── ModuleManager.tsx             # Drag-and-drop module ordering
│   ├── LessonForm.tsx                # Lesson create/edit (video upload + text editor)
│   ├── VideoUploader.tsx             # Bunny Stream upload component
│   └── CourseStatusBadge.tsx         # DRAFT/PUBLISHED/ARCHIVED badge

lib/
├── bunny/
│   ├── client.ts                     # Bunny Stream API client
│   ├── upload.ts                     # Video upload helpers
│   └── signed-url.ts                # Token-authenticated playback URL
```

---

## Skills Structure

```
.claude/
├── skills/
│   ├── frontend-design/
│   │   └── SKILL.md              # Anthropic design skill
│   ├── baseline-ui/
│   │   └── SKILL.md              # UI polish
│   ├── fixing-accessibility/
│   │   └── SKILL.md              # a11y fixes
│   └── fixing-motion-performance/
│       └── SKILL.md              # animation perf
├── commands/                      # custom commands (later)
└── settings.json
```
