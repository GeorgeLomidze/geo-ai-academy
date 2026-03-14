import { prisma } from "@/lib/prisma";
import type {
  LearningCourse,
  LearningLesson,
  LearningLessonDetail,
} from "@/lib/learn-shared";
import { calculateCourseProgress } from "@/lib/learn-shared";

type RawProgress = {
  completed: boolean;
  watchedSeconds: number;
  updatedAt: Date;
};

type RawLesson = {
  id: string;
  title: string;
  type: "VIDEO" | "TEXT";
  duration: number;
  sortOrder: number;
  progress: RawProgress[];
};

type RawModule = {
  id: string;
  title: string;
  sortOrder: number;
  lessons: RawLesson[];
};

type RawCourseShell = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  shortDescription: string | null;
  thumbnailUrl: string | null;
  enrollments: { id: string }[];
  modules: RawModule[];
};

function getCourseShellSelect(userId: string) {
  return {
    id: true,
    title: true,
    slug: true,
    description: true,
    shortDescription: true,
    thumbnailUrl: true,
    enrollments: {
      where: { userId },
      select: { id: true },
      take: 1,
    },
    modules: {
      orderBy: { sortOrder: "asc" as const },
      include: {
        lessons: {
          orderBy: { sortOrder: "asc" as const },
          select: {
            id: true,
            title: true,
            type: true,
            duration: true,
            sortOrder: true,
            progress: {
              where: { userId },
              select: {
                completed: true,
                watchedSeconds: true,
                updatedAt: true,
              },
              take: 1,
            },
          },
        },
      },
    },
  };
}

function mapCourseShell(course: RawCourseShell): LearningCourse {
  const modules = course.modules.map((module) => {
    const lessons = module.lessons.map((lesson) => {
      const progress = lesson.progress[0];
      return {
        id: lesson.id,
        title: lesson.title,
        type: lesson.type,
        duration: lesson.duration,
        sortOrder: lesson.sortOrder,
        href: `/learn/${course.slug}/${lesson.id}`,
        completed: progress?.completed ?? false,
        watchedSeconds: progress?.watchedSeconds ?? 0,
        updatedAt: progress?.updatedAt ?? null,
      };
    });

    const totalLessons = lessons.length;
    const completedLessons = lessons.filter((lesson) => lesson.completed).length;
    const progressPercentage = calculateCourseProgress(
      completedLessons,
      totalLessons
    );

    return {
      id: module.id,
      title: module.title,
      sortOrder: module.sortOrder,
      lessons,
      totalLessons,
      completedLessons,
      progressPercentage,
    };
  });

  const orderedLessons = modules.flatMap((module) => module.lessons);
  const totalLessons = orderedLessons.length;
  const completedLessons = orderedLessons.filter((lesson) => lesson.completed).length;
  const progressPercentage = calculateCourseProgress(
    completedLessons,
    totalLessons
  );

  const startedIncompleteLessons = orderedLessons
    .filter((lesson) => !lesson.completed && lesson.watchedSeconds > 0)
    .sort((a, b) => (b.updatedAt?.getTime() ?? 0) - (a.updatedAt?.getTime() ?? 0));

  const resumeLesson =
    startedIncompleteLessons[0] ??
    orderedLessons.find((lesson) => !lesson.completed) ??
    orderedLessons[0] ??
    null;

  return {
    id: course.id,
    title: course.title,
    slug: course.slug,
    description: course.description,
    shortDescription: course.shortDescription,
    thumbnailUrl: course.thumbnailUrl,
    modules,
    orderedLessons,
    totalLessons,
    completedLessons,
    progressPercentage,
    resumeLesson,
  };
}

export async function getLearningCourse(userId: string, slug: string): Promise<{
  course: LearningCourse | null;
  enrolled: boolean;
}> {
  const rawCourse = await prisma.course.findUnique({
    where: { slug },
    select: getCourseShellSelect(userId),
  });

  if (!rawCourse) {
    return { course: null, enrolled: false };
  }

  const course = mapCourseShell(rawCourse as RawCourseShell);
  return {
    course,
    enrolled: rawCourse.enrollments.length > 0,
  };
}

export async function getLearningLessonData(
  userId: string,
  slug: string,
  lessonId: string
): Promise<{
  course: LearningCourse | null;
  enrolled: boolean;
  lesson: LearningLessonDetail | null;
  prevLesson: LearningLesson | null;
  nextLesson: LearningLesson | null;
}> {
  const { course, enrolled } = await getLearningCourse(userId, slug);

  if (!course) {
    return {
      course: null,
      enrolled: false,
      lesson: null,
      prevLesson: null,
      nextLesson: null,
    };
  }

  const rawLesson = await prisma.lesson.findFirst({
    where: {
      id: lessonId,
      module: {
        course: {
          slug,
        },
      },
    },
    select: {
      id: true,
      title: true,
      type: true,
      content: true,
      bunnyVideoId: true,
      duration: true,
      moduleId: true,
      module: {
        select: {
          title: true,
        },
      },
      attachments: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          fileName: true,
          fileSize: true,
          fileType: true,
        },
      },
      progress: {
        where: { userId },
        select: {
          completed: true,
          watchedSeconds: true,
        },
        take: 1,
      },
    },
  });

  if (!rawLesson) {
    return {
      course,
      enrolled,
      lesson: null,
      prevLesson: null,
      nextLesson: null,
    };
  }

  const lessonProgress = rawLesson.progress[0];
  const lesson = {
    id: rawLesson.id,
    title: rawLesson.title,
    type: rawLesson.type,
    content: rawLesson.content,
    bunnyVideoId: rawLesson.bunnyVideoId,
    duration: rawLesson.duration,
    moduleId: rawLesson.moduleId,
    moduleTitle: rawLesson.module.title,
    completed: lessonProgress?.completed ?? false,
    watchedSeconds: lessonProgress?.watchedSeconds ?? 0,
    attachments: rawLesson.attachments,
  };

  const currentIndex = course.orderedLessons.findIndex(
    (candidate) => candidate.id === lessonId
  );
  const prevLesson =
    currentIndex > 0 ? course.orderedLessons[currentIndex - 1] ?? null : null;
  const nextLesson =
    currentIndex >= 0 ? course.orderedLessons[currentIndex + 1] ?? null : null;

  return {
    course,
    enrolled,
    lesson,
    prevLesson,
    nextLesson,
  };
}
