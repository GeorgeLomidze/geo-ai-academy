ALTER TABLE "questions"
ADD COLUMN "imageUrl" TEXT,
ADD COLUMN "adminReadAt" TIMESTAMP(3);

ALTER TABLE "answers"
ADD COLUMN "imageUrl" TEXT;

UPDATE "questions"
SET "adminReadAt" = "createdAt"
WHERE "adminReadAt" IS NULL;
