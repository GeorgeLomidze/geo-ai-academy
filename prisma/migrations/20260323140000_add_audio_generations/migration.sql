ALTER TYPE "GenerationType" ADD VALUE IF NOT EXISTS 'AUDIO';

ALTER TABLE "generations"
ADD COLUMN "outputText" TEXT,
ADD COLUMN "outputData" JSONB;
