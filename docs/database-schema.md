# Database Schema (Prisma)

## Sprint 1 — User Model

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

---

## Sprint 2 — Course System

```prisma
model User {
  id            String       @id @default(uuid())
  email         String       @unique
  name          String?
  avatarUrl     String?
  role          Role         @default(STUDENT)
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt
  enrollments   Enrollment[]
  progress      LessonProgress[]
}

model Course {
  id            String       @id @default(uuid())
  title         String
  slug          String       @unique
  description   String       @db.Text
  shortDescription String?
  thumbnailUrl  String?
  price         Decimal      @default(0) @db.Decimal(10, 2)
  currency      String       @default("GEL")
  status        CourseStatus  @default(DRAFT)
  sortOrder     Int          @default(0)
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt
  modules       Module[]
  enrollments   Enrollment[]
}

model Module {
  id            String       @id @default(uuid())
  title         String
  sortOrder     Int          @default(0)
  courseId       String
  course        Course       @relation(fields: [courseId], references: [id], onDelete: Cascade)
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt
  lessons       Lesson[]
}

model Lesson {
  id            String       @id @default(uuid())
  title         String
  type          LessonType   @default(VIDEO)
  content       String?      @db.Text
  bunnyVideoId  String?
  duration      Int?
  isFree        Boolean      @default(false)
  sortOrder     Int          @default(0)
  moduleId      String
  module        Module       @relation(fields: [moduleId], references: [id], onDelete: Cascade)
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt
  progress      LessonProgress[]
}

model Enrollment {
  id            String       @id @default(uuid())
  userId        String
  courseId       String
  user          User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  course        Course       @relation(fields: [courseId], references: [id], onDelete: Cascade)
  enrolledAt    DateTime     @default(now())

  @@unique([userId, courseId])
}

model LessonProgress {
  id            String       @id @default(uuid())
  userId        String
  lessonId      String
  completed     Boolean      @default(false)
  watchedSeconds Int         @default(0)
  completedAt   DateTime?
  user          User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  lesson        Lesson       @relation(fields: [lessonId], references: [id], onDelete: Cascade)

  @@unique([userId, lessonId])
}

enum Role {
  STUDENT
  ADMIN
}

enum CourseStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}

enum LessonType {
  VIDEO
  TEXT
}
```

---

## Sprint 2.5 — Reviews (additions)

```prisma
// Add to User model:
  reviews       Review[]

// Add to Course model:
  reviews          Review[]

model Review {
  id          String    @id @default(uuid())
  rating      Decimal   @db.Decimal(2, 1)
  comment     String    @db.Text
  userId      String
  courseId    String
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  course      Course    @relation(fields: [courseId], references: [id], onDelete: Cascade)

  @@unique([userId, courseId])
  @@index([courseId])
  @@index([userId])
}
```
