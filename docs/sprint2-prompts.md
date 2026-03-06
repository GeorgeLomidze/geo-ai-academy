# Sprint 2 Prompt Sequence

## Sprint 2 Goal
Build the complete course management and learning system:
1. Database schema for courses, modules, lessons, enrollments
2. Bunny Stream integration for video hosting
3. Admin: full course creation/editing workflow
4. Public: course catalog with real data
5. Student: course learning page with video player + text lessons
6. Student: enrollment and progress tracking

### Sprint 2 Prerequisites
Bunny Stream account configured with these env vars:
- BUNNY_STREAM_API_KEY
- BUNNY_STREAM_LIBRARY_ID
- BUNNY_STREAM_CDN_HOSTNAME
- BUNNY_STREAM_TOKEN_AUTH_KEY

### NOT in Sprint 2
- Flitt payment integration (Sprint 3)
- Quizzes and certificates (Sprint 4)
- Email notifications (Sprint 4)
- Coupons / discounts (Sprint 4)

---

### Prompt 10: Prisma Schema Expansion
```
Expand prisma/schema.prisma with Sprint 2 models from CLAUDE.md:
- Course (title, slug, description, shortDescription, thumbnailUrl, price in GEL, status DRAFT/PUBLISHED/ARCHIVED, sortOrder)
- Module (title, sortOrder, belongs to Course, cascade delete)
- Lesson (title, type VIDEO/TEXT, content for text lessons, bunnyVideoId for videos, duration, isFree flag, sortOrder, belongs to Module, cascade delete)
- Enrollment (userId + courseId, unique constraint, enrolledAt)
- LessonProgress (userId + lessonId, unique constraint, completed, watchedSeconds, completedAt)
- Update User model with enrollments and progress relations
Run: npx prisma migrate dev --name add-course-system
Then: npx prisma generate
```

### Prompt 11: Bunny Stream Integration
```
Create Bunny Stream integration:
- lib/bunny/client.ts: Bunny Stream API client using fetch. Functions: listVideos, getVideo, deleteVideo, createVideo (returns upload URL).
- lib/bunny/upload.ts: helper to get direct upload URL from Bunny (TUS protocol). The upload happens client-side directly to Bunny, not through our server.
- lib/bunny/signed-url.ts: generate token-authenticated embed URL for video playback. Use BUNNY_STREAM_TOKEN_AUTH_KEY to sign URLs with expiry (4 hours).
- app/api/admin/upload/route.ts: POST endpoint — admin only, calls createVideo on Bunny, returns { videoId, uploadUrl } to frontend.
Environment variables: BUNNY_STREAM_API_KEY, BUNNY_STREAM_LIBRARY_ID, BUNNY_STREAM_CDN_HOSTNAME, BUNNY_STREAM_TOKEN_AUTH_KEY.
All text/error messages in Georgian.
```

### Prompt 12: Admin Course CRUD API
```
Create admin API routes for course management:
- app/api/admin/courses/route.ts:
  - GET: list all courses with module/lesson counts, ordered by sortOrder. Admin only.
  - POST: create new course (title, slug auto-generated from title, description, price, status). Validate with Zod. Admin only.
- app/api/admin/courses/[courseId]/route.ts:
  - GET: single course with all modules and lessons
  - PUT: update course fields (title, description, shortDescription, thumbnailUrl, price, status, sortOrder)
  - DELETE: delete course (cascade deletes modules, lessons)
- app/api/admin/modules/route.ts:
  - POST: create module in a course
  - PUT: reorder modules (receives array of {id, sortOrder})
  - DELETE: delete module
- app/api/admin/lessons/route.ts:
  - POST: create lesson in a module (type VIDEO or TEXT, content or bunnyVideoId)
  - PUT: update lesson fields
  - DELETE: delete lesson
All routes: admin role check, Zod validation, proper error responses.
Slug generation: Georgian text → transliterate to Latin → kebab-case. Use a simple Georgian→Latin map.
All error messages in Georgian.
```

### Prompt 13: Admin Course Management Pages
```
Create admin course management pages:
- app/(admin)/admin/courses/page.tsx: DataTable with columns: thumbnail, title, status badge (DRAFT=yellow, PUBLISHED=green, ARCHIVED=gray), modules count, lessons count, price, actions (edit, delete). "ახალი კურსის დამატება" button → /admin/courses/new. Use shadcn Table component.
- app/(admin)/admin/courses/new/page.tsx: CourseForm component — title, slug (auto-generated, editable), description (textarea), short description, price (number input with ₾ symbol), thumbnail URL input. Save → POST /api/admin/courses → redirect to edit page.
- app/(admin)/admin/courses/[courseId]/page.tsx: Same CourseForm pre-filled for editing. PUT on save.
- app/(admin)/admin/courses/[courseId]/modules/page.tsx: ModuleManager — list modules as accordion. Each module shows its lessons. Add module button, add lesson button per module. Drag-and-drop reorder for modules and lessons (use @dnd-kit/core). LessonForm: type selector (VIDEO/TEXT), for VIDEO: VideoUploader component (file input → upload to Bunny → show progress), for TEXT: textarea/markdown input. isFree toggle. Duration input for videos.
- app/(admin)/admin/courses/[courseId]/settings/page.tsx: Course status selector (DRAFT/PUBLISHED/ARCHIVED), danger zone with delete button (confirm dialog).

All "use client" where needed. All text in Georgian.
Navigation between course tabs: use shadcn Tabs or sub-navigation (edit, modules, settings).
```

### Prompt 14: Video Uploader Component
```
Create VideoUploader component for admin lesson management:
- components/admin/VideoUploader.tsx ("use client"):
  - File input accepting video/* files
  - On file select: call /api/admin/upload to get { videoId, uploadUrl }
  - Upload file directly to Bunny using TUS protocol (tus-js-client library)
  - Show upload progress bar (percentage + bytes)
  - On complete: return bunnyVideoId to parent component
  - Show video preview thumbnail after upload (Bunny generates this automatically)
  - Error handling with retry button
  - Max file size indication: "მაქსიმუმ 2GB"
Install tus-js-client: npm install tus-js-client
All text in Georgian.
```

### Prompt 15: Public Course Catalog
```
Update the public courses page with real data:
- app/(public)/courses/page.tsx: fetch published courses from database. Display as grid of CourseCard components. If no courses: empty state "კურსები მალე დაემატება". Sort by sortOrder.
- components/course/CourseCard.tsx: thumbnail (with fallback gradient), title, short description (truncated 2 lines), price with ₾ symbol (or "უფასო" if price is 0), lesson count, "დეტალურად" button.
- components/course/CourseGrid.tsx: responsive grid (1 col mobile, 2 cols tablet, 3 cols desktop).
- components/course/PriceTag.tsx: displays price formatted with Georgian Lari symbol ₾.
- app/(public)/courses/[slug]/page.tsx: Course detail page — hero section with title, description, price, "კურსის შეძენა" or "კურსის დაწყება" button (depends on enrollment status). Module list as accordion showing lesson titles (locked/unlocked icons based on isFree). Course stats: total lessons, total duration, module count.
Apply frontend-design skill principles. All text in Georgian.
Update landing page FeaturedCourses to show real courses from database (latest 3 published).
```

### Prompt 16: Student Enrollment & My Courses
```
Create enrollment system and student course pages:
- app/api/enroll/route.ts: POST — authenticated user enrolls in a course. Check: user exists, course is PUBLISHED, not already enrolled. Create Enrollment record. For Sprint 2 enrollment is free (payment in Sprint 3), but still create the enrollment record.
- app/(student)/my-courses/page.tsx: list enrolled courses with progress percentage. Each card shows: thumbnail, title, progress bar, "გაგრძელება" button → /learn/[slug]. Empty state: "ჯერ არ ხარ ჩაწერილი არცერთ კურსზე" + CTA to catalog.
- Update student dashboard (app/(student)/dashboard/page.tsx): show latest 3 enrolled courses with progress. Quick stats: total enrolled, completed courses, active course.
- Update StudentSidebar or navbar with "ჩემი კურსები" link.
All text in Georgian.
```

### Prompt 17: Learning Page (Video + Text Player)
```
Create the course learning page:
- app/(student)/learn/[slug]/page.tsx: course overview — module accordion with lesson links, overall progress bar, "გაგრძელება" button (resumes last incomplete lesson).
- app/(student)/learn/[slug]/[lessonId]/page.tsx: lesson viewer page.
  - Layout: video/text content area (left/top) + LessonSidebar (right/bottom on mobile)
  - For VIDEO lessons: VideoPlayer component with Bunny Stream iframe, signed URL from server
  - For TEXT lessons: TextLesson component rendering lesson.content as formatted text
  - Below content: "შემდეგი გაკვეთილი" button, lesson title, module title
  - Auto-mark lesson as complete when video reaches 90% or when student clicks "დასრულება" on text lesson
- components/learn/VideoPlayer.tsx: Bunny Stream iframe embed, responsive 16:9 aspect ratio, loading skeleton
- components/learn/TextLesson.tsx: styled text content display with proper typography
- components/learn/LessonSidebar.tsx: collapsible sidebar showing all modules/lessons, current lesson highlighted, completed lessons have checkmark icon, progress percentage per module
- components/learn/ProgressBar.tsx: animated progress bar with percentage label
- app/api/progress/route.ts: POST — update lesson progress (watchedSeconds, completed). Authenticated, validates lessonId belongs to enrolled course.
Protect learning pages: user must be enrolled in the course. If not enrolled, redirect to course detail page.
All text in Georgian.
```

### Prompt 18: Progress Tracking & API Polish
```
Implement progress tracking and polish APIs:
- VideoPlayer: post progress every 30 seconds while playing (debounced), send watchedSeconds to /api/progress. Mark complete at 90% of duration.
- Course progress calculation: (completed lessons / total lessons) * 100, used in my-courses page and learn sidebar.
- app/api/courses/route.ts: GET public courses list — only PUBLISHED, with module/lesson counts. Used by catalog page.
- Add proper error boundaries for all course pages
- Add loading.tsx skeletons for: course catalog, course detail, learning page, admin courses list
- Verify all admin routes have role check
- Verify all student routes require authentication
- Verify enrollment check on learning pages
All error messages in Georgian.
```

### Prompt 19: Sprint 2 Design Polish
```
Review all Sprint 2 pages using frontend-design skill principles:
1. Course catalog: card design consistency, hover effects, responsive grid, filter/sort UI
2. Course detail page: compelling layout, clear CTA, module preview accordion
3. Admin course management: clean DataTable, intuitive course editing flow, module/lesson drag-and-drop UX
4. Video uploader: clear progress indication, error states
5. Learning page: comfortable reading/viewing experience, sidebar navigation UX, progress visualization
6. My courses page: progress bars, card design matching catalog cards
7. Run baseline-ui skill on all new pages
8. Check accessibility (fixing-accessibility skill)
9. Check motion performance (fixing-motion-performance skill)
10. Mobile responsiveness on all new pages — especially learning page (sidebar collapses to bottom)
```

---

## Bunny Stream Integration Details

### Video Upload Flow
1. Admin selects video file in LessonForm
2. Frontend gets upload URL from /api/admin/upload (server generates Bunny upload credentials)
3. File uploads directly to Bunny Stream (client-side, avoids server bottleneck)
4. Bunny returns videoId, stored in lesson.bunnyVideoId
5. Bunny processes video (encoding), webhook notifies when ready (optional)

### Video Playback Flow
1. Student opens lesson page
2. Server generates signed/tokenized URL for the video
3. Bunny Stream iframe player loads with signed URL
4. Player reports watch progress → /api/progress

### Bunny Stream iframe
```html
<iframe
  src="https://iframe.mediadelivery.net/embed/{libraryId}/{videoId}?token={signedToken}"
  loading="lazy"
  style="border: none; width: 100%; aspect-ratio: 16/9;"
  allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
  allowfullscreen
/>
```

---

## Workflow Reminder

For each prompt:
1. Paste the prompt into Claude Code
2. Review generated code (inline diffs in VS Code)
3. Accept changes
4. Test: `npm run dev` → check in browser
5. Commit: `git add . && git commit -m "prompt X: description"`
6. `/clear` to reset context
7. Next prompt

## Before Starting Sprint 2

1. Create Bunny.net account and Video Library
2. Add 4 Bunny env vars to .env.local
3. Add Sprint 2 section to CLAUDE.md (replace the Future Sprints reference)
4. Commit CLAUDE.md update
5. Start with Prompt 10
