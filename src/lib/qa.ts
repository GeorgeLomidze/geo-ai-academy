import type {
  AdminNotification,
  Answer,
  Question,
  User,
  UserNotification,
} from "@prisma/client";
import {
  getAdminNotificationDelegate,
  getUserNotificationDelegate,
  prisma,
} from "@/lib/prisma";

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
  imageUrls: string[];
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
  imageUrls: string[];
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
  authorName: string;
  questionPreview: string;
  contextLabel: string;
};

export type SerializedUserNotification = {
  id: string;
  type: string;
  title: string;
  message: string;
  linkUrl: string | null;
  isRead: boolean;
  createdAt: string;
  questionId: string | null;
  answerId: string | null;
  authorName: string;
  questionPreview: string;
};

type NotificationQuestionDetails = {
  id: string;
  content: string;
  user: {
    name: string | null;
    email: string;
  };
  lesson: {
    title: string;
    module: {
      course: {
        title: string;
      };
    };
  };
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

function normalizeImageUrls(
  imageUrls: string[] | null | undefined,
  fallbackImageUrl?: string | null
) {
  const normalized = (imageUrls ?? []).filter((value) => value.length > 0);

  if (normalized.length > 0) {
    return normalized;
  }

  if (fallbackImageUrl) {
    return [fallbackImageUrl];
  }

  return [];
}

export function getAnswerIdFromNotificationLink(linkUrl: string | null) {
  if (!linkUrl) {
    return null;
  }

  try {
    const url = new URL(linkUrl, "http://localhost");
    return url.searchParams.get("answerId");
  } catch {
    return null;
  }
}

function truncateNotificationText(value: string, maxLength = 120) {
  const normalized = value.replace(/\s+/g, " ").trim();

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 1).trimEnd()}…`;
}

export function buildQuestionNotificationPreview(content: string) {
  return truncateNotificationText(content, 140);
}

async function ensureAdminNotificationsForUnreadQuestions() {
  const adminNotification = getAdminNotificationDelegate();

  if (!adminNotification) {
    return;
  }

  const [unreadQuestions, existingNotifications] = await Promise.all([
    prisma.question.findMany({
      where: {
        adminReadAt: null,
      },
      select: {
        id: true,
        content: true,
        createdAt: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    }),
    adminNotification.findMany({
      select: {
        id: true,
        linkUrl: true,
        isRead: true,
        createdAt: true,
      },
    }),
  ]);

  const notificationsByQuestionId = new Map<
    string,
    Array<{
      id: string;
      linkUrl: string | null;
      isRead: boolean;
      createdAt: Date;
    }>
  >();

  for (const notification of existingNotifications) {
    const questionId = getQuestionIdFromNotificationLink(notification.linkUrl);

    if (!questionId) {
      continue;
    }

    const current = notificationsByQuestionId.get(questionId) ?? [];
    current.push(notification);
    notificationsByQuestionId.set(questionId, current);
  }

  const missingNotifications = unreadQuestions
    .filter((question) => !notificationsByQuestionId.has(question.id))
    .map((question) => ({
      type: "NEW_QUESTION",
      title: question.user.name ?? question.user.email ?? "სტუდენტი",
      message: buildQuestionNotificationPreview(question.content),
      linkUrl: `/admin/qa?questionId=${question.id}`,
      isRead: false,
      createdAt: question.createdAt,
    }));

  const repairOperations: Promise<unknown>[] = [];

  for (const question of unreadQuestions) {
    const notifications = notificationsByQuestionId.get(question.id) ?? [];

    if (notifications.length <= 1) {
      if (notifications[0]?.isRead) {
        repairOperations.push(
          adminNotification.update({
            where: { id: notifications[0].id },
            data: { isRead: false },
          })
        );
      }
      continue;
    }

    const [notificationToKeep, ...duplicates] = notifications.sort(
      (left, right) => left.createdAt.getTime() - right.createdAt.getTime()
    );

    if (notificationToKeep.isRead) {
      repairOperations.push(
        adminNotification.update({
          where: { id: notificationToKeep.id },
          data: { isRead: false },
        })
      );
    }

    repairOperations.push(
      adminNotification.deleteMany({
        where: {
          id: {
            in: duplicates.map((notification) => notification.id),
          },
        },
      })
    );
  }

  if (missingNotifications.length > 0) {
    repairOperations.push(
      adminNotification.createMany({
        data: missingNotifications,
      })
    );
  }

  if (repairOperations.length > 0) {
    await Promise.all(repairOperations);
  }
}

async function ensureUserNotificationsForAnswers(userId: string) {
  const userNotification = getUserNotificationDelegate();

  if (!userNotification) {
    return;
  }

  const [questionAnswers, existingNotifications] = await Promise.all([
    prisma.answer.findMany({
      where: {
        question: {
          userId,
        },
      },
      select: {
        id: true,
        content: true,
        createdAt: true,
        userId: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        question: {
          select: {
            userId: true,
            id: true,
            lessonId: true,
            lesson: {
              select: {
                module: {
                  select: {
                    course: {
                      select: {
                        slug: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    }),
    userNotification.findMany({
      where: { userId },
      select: {
        id: true,
        answerId: true,
        isRead: true,
        createdAt: true,
      },
    }),
  ]);

  const notificationsByAnswerId = new Map<
    string,
    Array<{
      id: string;
      answerId: string | null;
      isRead: boolean;
      createdAt: Date;
    }>
  >();

  for (const notification of existingNotifications) {
    if (!notification.answerId) {
      continue;
    }

    const current = notificationsByAnswerId.get(notification.answerId) ?? [];
    current.push(notification);
    notificationsByAnswerId.set(notification.answerId, current);
  }

  const validAnswers = questionAnswers.filter(
    (answer) => answer.userId !== answer.question.userId
  );

  const missingNotifications = validAnswers
    .filter((answer) => !notificationsByAnswerId.has(answer.id))
    .map((answer) => ({
      userId,
      type: "NEW_ANSWER",
      title: answer.user.name ?? answer.user.email ?? "მომხმარებელი",
      message: buildQuestionNotificationPreview(answer.content),
      linkUrl: `/learn/${answer.question.lesson.module.course.slug}/${answer.question.lessonId}#qa-section`,
      questionId: answer.question.id,
      answerId: answer.id,
      isRead: false,
      createdAt: answer.createdAt,
    }));

  const repairOperations: Promise<unknown>[] = [];

  for (const answer of validAnswers) {
    const notifications = notificationsByAnswerId.get(answer.id) ?? [];

    if (notifications.length <= 1) {
      continue;
    }

    const [, ...duplicates] = notifications.sort(
      (left, right) => left.createdAt.getTime() - right.createdAt.getTime()
    );

    repairOperations.push(
      userNotification.deleteMany({
        where: {
          id: {
            in: duplicates.map((notification) => notification.id),
          },
        },
      })
    );
  }

  if (missingNotifications.length > 0) {
    repairOperations.push(
      userNotification.createMany({
        data: missingNotifications,
      })
    );
  }

  if (repairOperations.length > 0) {
    await Promise.all(repairOperations);
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
  answer: Answer & { user: QAUser; imageUrls?: string[] },
  currentUserId: string,
  isAdmin: boolean
): SerializedAnswer {
  const imageUrls = normalizeImageUrls(answer.imageUrls, answer.imageUrl);

  return {
    id: answer.id,
    content: answer.content,
    imageUrl: imageUrls[0] ?? null,
    imageUrls,
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
  const imageUrls = normalizeImageUrls(
    (question as Question & { imageUrls?: string[] }).imageUrls,
    question.imageUrl
  );

  return {
    id: question.id,
    content: question.content,
    imageUrl: imageUrls[0] ?? null,
    imageUrls,
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
      imageUrls: true,
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
          imageUrls: true,
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
  const adminNotification = getAdminNotificationDelegate();

  if (!adminNotification) {
    return {
      notifications: [],
      unreadCount: 0,
    };
  }

  await ensureAdminNotificationsForUnreadQuestions();

  const [notifications, unreadCount] = await Promise.all([
    adminNotification.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    }),
    adminNotification.count({
      where: { isRead: false },
    }),
  ]);

  const questionIds = Array.from(
    new Set(
      notifications
        .map((notification) => getQuestionIdFromNotificationLink(notification.linkUrl))
        .filter((questionId): questionId is string => Boolean(questionId))
    )
  );

  const questions = questionIds.length
    ? await prisma.question.findMany({
        where: {
          id: {
            in: questionIds,
          },
        },
        select: {
          id: true,
          content: true,
          user: {
            select: {
              name: true,
              email: true,
            },
          },
          lesson: {
            select: {
              title: true,
              module: {
                select: {
                  course: {
                    select: {
                      title: true,
                    },
                  },
                },
              },
            },
          },
        },
      })
    : [];

  const questionMap = new Map<string, NotificationQuestionDetails>(
    questions.map((question) => [question.id, question as NotificationQuestionDetails])
  );

  return {
    notifications: notifications.map((notification) =>
      serializeAdminNotification(
        notification,
        questionMap.get(getQuestionIdFromNotificationLink(notification.linkUrl) ?? "")
      )
    ),
    unreadCount,
  };
}

export async function getUserNotifications(userId: string, limit = 8) {
  const userNotification = getUserNotificationDelegate();

  if (!userNotification) {
    return {
      notifications: [],
      unreadCount: 0,
    };
  }

  await ensureUserNotificationsForAnswers(userId);

  const [notifications, unreadCount] = await Promise.all([
    userNotification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    }),
    userNotification.count({
      where: {
        userId,
        isRead: false,
      },
    }),
  ]);

  return {
    notifications: notifications.map(serializeUserNotification),
    unreadCount,
  };
}

export function serializeAdminNotification(
  notification: AdminNotification,
  questionDetails?: NotificationQuestionDetails
): SerializedAdminNotification {
  const questionId = getQuestionIdFromNotificationLink(notification.linkUrl);
  const authorName =
    questionDetails?.user.name ??
    questionDetails?.user.email ??
    notification.title ??
    "სტუდენტი";
  const questionPreview = truncateNotificationText(
    questionDetails?.content ?? notification.message
  );
  const contextLabel = questionDetails
    ? `${questionDetails.lesson.module.course.title} / ${questionDetails.lesson.title}`
    : "კითხვა-პასუხი";

  return {
    id: notification.id,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    linkUrl: questionId ? `/admin/qa?questionId=${questionId}` : notification.linkUrl,
    isRead: notification.isRead,
    createdAt: notification.createdAt.toISOString(),
    questionId,
    authorName,
    questionPreview,
    contextLabel,
  };
}

export function serializeUserNotification(
  notification: UserNotification
): SerializedUserNotification {
  return {
    id: notification.id,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    linkUrl: notification.linkUrl,
    isRead: notification.isRead,
    createdAt: notification.createdAt.toISOString(),
    questionId: notification.questionId,
    answerId: notification.answerId,
    authorName: notification.title,
    questionPreview: truncateNotificationText(notification.message),
  };
}
