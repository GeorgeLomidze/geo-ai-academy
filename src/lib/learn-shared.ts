export type LearningLesson = {
  id: string;
  title: string;
  type: "VIDEO" | "TEXT";
  duration: number;
  sortOrder: number;
  href: string;
  completed: boolean;
  watchedSeconds: number;
  updatedAt: Date | null;
};

export type LearningModule = {
  id: string;
  title: string;
  sortOrder: number;
  lessons: LearningLesson[];
  totalLessons: number;
  completedLessons: number;
  progressPercentage: number;
};

export type LearningCourse = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  shortDescription: string | null;
  thumbnailUrl: string | null;
  modules: LearningModule[];
  orderedLessons: LearningLesson[];
  totalLessons: number;
  completedLessons: number;
  progressPercentage: number;
  resumeLesson: LearningLesson | null;
};

export type LearningLessonDetail = {
  id: string;
  title: string;
  type: "VIDEO" | "TEXT";
  content: string | null;
  bunnyVideoId: string | null;
  duration: number;
  moduleId: string;
  moduleTitle: string;
  completed: boolean;
  watchedSeconds: number;
};

export function calculateCourseProgress(
  completedLessons: number,
  totalLessons: number
) {
  if (totalLessons <= 0) {
    return 0;
  }

  return Math.round((completedLessons / totalLessons) * 100);
}

export function summarizeLessonCompletion<
  TModule extends { lessons: Array<{ id: string }> },
>(modules: TModule[], completedLessonIds: Set<string>) {
  const totalLessons = modules.reduce(
    (sum, module) => sum + module.lessons.length,
    0
  );
  const completedLessons = modules.reduce(
    (sum, module) =>
      sum + module.lessons.filter((lesson) => completedLessonIds.has(lesson.id)).length,
    0
  );

  return {
    totalLessons,
    completedLessons,
    progressPercentage: calculateCourseProgress(completedLessons, totalLessons),
  };
}

export function formatLessonDuration(seconds: number) {
  if (!seconds) {
    return "0 წთ";
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  if (hours > 0) {
    return `${hours} სთ ${minutes} წთ`;
  }

  if (minutes > 0) {
    return remainingSeconds > 0
      ? `${minutes} წთ ${remainingSeconds} წმ`
      : `${minutes} წთ`;
  }

  return `${remainingSeconds} წმ`;
}
