-- CreateTable
CREATE TABLE "Module" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT 'gray',
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Module_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Module_name_key" ON "Module"("name");

-- AlterTable
ALTER TABLE "Category" ADD COLUMN "moduleId" TEXT;

-- CreateIndex
CREATE INDEX "Category_moduleId_idx" ON "Category"("moduleId");

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "WorkloadAllocation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "percentage" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkloadAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WorkloadAllocation_moduleId_idx" ON "WorkloadAllocation"("moduleId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkloadAllocation_userId_moduleId_key" ON "WorkloadAllocation"("userId", "moduleId");

-- AddForeignKey
ALTER TABLE "WorkloadAllocation" ADD CONSTRAINT "WorkloadAllocation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkloadAllocation" ADD CONSTRAINT "WorkloadAllocation_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed the 3 work modules discussed for the OCS restructuring
INSERT INTO "Module" ("id", "name", "color", "order") VALUES
  ('module-ip', '智財相關事務', 'gray', 0),
  ('module-mkt', '營銷與永續支援', 'blue', 1),
  ('module-comm', '傳播事務', 'purple', 2)
ON CONFLICT ("name") DO NOTHING;

-- Assign existing categories to their module (傳播事務 has none yet —
-- it's a new subdivision that doesn't map cleanly onto an existing category)
UPDATE "Category" SET "moduleId" = 'module-ip' WHERE "id" = 'category-ip';
UPDATE "Category" SET "moduleId" = 'module-mkt' WHERE "id" IN (
  'category-comm', 'category-events', 'category-gifts', 'category-sustain', 'category-biz'
);
