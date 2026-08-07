-- AlterEnum
ALTER TYPE "ActivityAction" ADD VALUE 'HEALTH_CHANGED';
ALTER TYPE "ActivityAction" ADD VALUE 'NOTE_UPDATED';

-- CreateEnum
CREATE TYPE "TaskHealth" AS ENUM ('ON_TRACK', 'AT_RISK', 'DELAYED');

-- AlterTable
ALTER TABLE "Task" ADD COLUMN "health" "TaskHealth" NOT NULL DEFAULT 'ON_TRACK';
