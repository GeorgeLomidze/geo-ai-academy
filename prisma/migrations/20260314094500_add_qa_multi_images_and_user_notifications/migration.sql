ALTER TABLE "questions"
ADD COLUMN "imageUrls" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

ALTER TABLE "answers"
ADD COLUMN "imageUrls" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

UPDATE "questions"
SET "imageUrls" = ARRAY["imageUrl"]
WHERE "imageUrl" IS NOT NULL
  AND cardinality("imageUrls") = 0;

UPDATE "answers"
SET "imageUrls" = ARRAY["imageUrl"]
WHERE "imageUrl" IS NOT NULL
  AND cardinality("imageUrls") = 0;

CREATE TABLE "user_notifications" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" TEXT NOT NULL DEFAULT 'NEW_ANSWER',
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "linkUrl" TEXT,
  "questionId" TEXT,
  "answerId" TEXT,
  "isRead" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "user_notifications_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "user_notifications_userId_isRead_idx" ON "user_notifications"("userId", "isRead");
CREATE INDEX "user_notifications_questionId_idx" ON "user_notifications"("questionId");
CREATE INDEX "user_notifications_answerId_idx" ON "user_notifications"("answerId");

ALTER TABLE "user_notifications"
ADD CONSTRAINT "user_notifications_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
