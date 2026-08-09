-- CreateEnum
CREATE TYPE "StaffTier" AS ENUM ('EXECUTION', 'MANAGEMENT');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "staffTier" "StaffTier" NOT NULL DEFAULT 'EXECUTION';
