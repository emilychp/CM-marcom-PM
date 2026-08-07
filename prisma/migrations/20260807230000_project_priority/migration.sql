-- AlterEnum
ALTER TYPE "ActivityAction" ADD VALUE 'PRIORITY_CHANGED';

-- CreateEnum
CREATE TYPE "ProjectPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- AlterTable
ALTER TABLE "Project" ADD COLUMN "priority" "ProjectPriority" NOT NULL DEFAULT 'MEDIUM';
