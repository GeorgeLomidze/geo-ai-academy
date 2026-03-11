import type { AdminNotification, Answer, Question, User } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type QAUser = Pick<User, "id" | "name" | "avatarUrl" | "email">;

type QuestionWithAnswers = Question & {
  user: QAUser;
  answers: (Answer & {
    user: QAUser;
  })[];
};

export type SerializedAnswer = {
  id: string;
  content: string;
  imageUrl: string | null;
  userId: string;
  questionId: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string | null;
    avatarUrl: string | null;
  };
  permissions: {
    canEdit: boolean;
    canDelete: boolean;
  };
};

export type SerializedQuestion = {
  id: string;
  content: string;
  imageUrl: string | null;
  userId: string;
  lessonId: string;
  createdAt: string;
  updatedAt: string;
  answersCount: number;
  user: {
    id: string;
    name: string | null;
    avatarUrl: string | null;
  };
  answers: SerializedAnswer[];
  permissions: {
    canEdit: boolean;
    canDelete: boolean;
  };
};

export type SerializedAdminNotification = {
  id: string;
  type: string;
  title: string;
  message: string;
  linkUrl: string | null;
  isRead: boolean;
  createdAt: string;
  questionId: string | null;
};

export function getQuestionIdFromNotificationLink(linkUrl: string | null) {
  if (!linkUrl) {
    return null;
  }

  try {
    const url = new URL(linkUrl, "http://localhost");
    return url.searchParams.get("questionId");
  } catch {
    return null;
  }
}

export async function getUserRole(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  return user?.role ?? "STUDENT";
}

export async function getEnrollmentAccessForLesson(userId: string, lessonId: string) {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: {
      id: true,
      title: true,
      module: {
        select: {
          course: {
            select: {
              id: true,
              title: true,
              slug: true,
              enrollments: {
                where: { userId },
                select: { id: true },
                take: 1,
              },
            },
          },
        },
      },
    },
  });

  if (!lesson) {
    return null;
  }

  return {
    lesson: {
      id: lesson.id,
      title: lesson.title,
    },
    course: {
      id: lesson.module.course.id,
      title: lesson.module.course.title,
      slug: lesson.module.course.slug,
    },
    enrolled: lesson.module.course.enrollments.length > 0,
  };
}

export function serializeAnswer(
  answer: Answer & { user: QAUser },
  currentUserId: string,
  isAdmin: boolean
): SerializedAnswer {
  return {
    id: answer.id,
    content: answer.content,
    imageUrl: answer.imageUrl,
    userId: answer.userId,
    questionId: answer.questionId,
    createdAt: answer.createdAt.toISOString(),
    updatedAt: answer.updatedAt.toISOString(),
    user: {
      id: answer.user.id,
      name: answer.user.name,
      avatarUrl: answer.user.avatarUrl,
    },
    permissions: {
      canEdit: answer.userId === currentUserId,
      canDelete: isAdmin || answer.userId === currentUserId,
    },
  };
}

export function serializeQuestion(
  question: QuestionWithAnswers,
  currentUserId: string,
  isAdmin: boolean
): SerializedQuestion {
  return {
    id: question.id,
    content: question.content,
    imageUrl: question.imageUrl,
    userId: question.userId,
    lessonId: question.lessonId,
    createdAt: question.createdAt.toISOString(),
    updatedAt: question.updatedAt.toISOString(),
    answersCount: question.answers.length,
    user: {
      id: question.user.id,
      name: question.user.name,
      avatarUrl: question.user.avatarUrl,
    },
    answers: question.answers.map((answer) =>
      serializeAnswer(answer, currentUserId, isAdmin)
    ),
    permissions: {
      canEdit: question.userId === currentUserId,
      canDelete: isAdmin || question.userId === currentUserId,
    },
  };
}

export async function getSerializedQuestionsForLesson(
  lessonId: string,
  currentUserId: string,
  isAdmin: boolean
) {
  const questions = await prisma.question.findMany({
    where: { lessonId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      content: true,
      imageUrl: true,
      adminReadAt: true,
      userId: true,
      lessonId: true,
      createdAt: true,
      updatedAt: true,
      user: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
          email: true,
        },
      },
      answers: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          content: true,
          imageUrl: true,
          userId: true,
          questionId: true,
          createdAt: true,
          updatedAt: true,
          user: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
              email: true,
            },
          },
        },
      },
    },
  });

  return questions.map((question) =>
    serializeQuestion(question as QuestionWithAnswers, currentUserId, isAdmin)
  );
}

export async function getAdminNotifications(limit = 8) {
  if (!("adminNotification" in prisma) || typeof prisma.adminNotification === "undefined") {
    return {
      notifications: [],
      unreadCount: 0,
    };
  }

  const [notifications, unreadCount] = await Promise.all([
    prisma.adminNotification.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    }),
    prisma.adminNotification.count({
      where: { isRead: false },
    }),
  ]);

  return {
    notifications: notifications.map(serializeAdminNotification),
    unreadCount,
  };
}

export function serializeAdminNotification(
  notification: AdminNotification
): SerializedAdminNotification {
  return {
    id: notification.id,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    linkUrl: notification.linkUrl,
    isRead: notification.isRead,
    createdAt: notification.createdAt.toISOString(),
    questionId: getQuestionIdFromNotificationLink(notification.linkUrl),
  };
}
