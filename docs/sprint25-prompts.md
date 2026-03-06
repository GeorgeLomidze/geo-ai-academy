# Sprint 2.5 — Course Reviews & Comments

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
