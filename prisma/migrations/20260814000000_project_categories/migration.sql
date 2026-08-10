-- AlterEnum
ALTER TYPE "ActivityAction" ADD VALUE 'CATEGORIES_CHANGED';

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT 'gray',
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectCategory" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectCategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

-- CreateIndex
CREATE INDEX "ProjectCategory_projectId_idx" ON "ProjectCategory"("projectId");

-- CreateIndex
CREATE INDEX "ProjectCategory_categoryId_idx" ON "ProjectCategory"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectCategory_projectId_categoryId_key" ON "ProjectCategory"("projectId", "categoryId");

-- AddForeignKey
ALTER TABLE "ProjectCategory" ADD CONSTRAINT "ProjectCategory_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectCategory" ADD CONSTRAINT "ProjectCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed default categories (matching 專案總覽分類標籤.xlsx)
INSERT INTO "Category" ("id", "name", "color", "order") VALUES
  ('category-comm', '溝通管理', 'blue', 0),
  ('category-events', '內外活動', 'purple', 1),
  ('category-gifts', '禮贈品', 'yellow', 2),
  ('category-sustain', '永續相關', 'green', 3),
  ('category-biz', '業務管理', 'red', 4),
  ('category-ip', '智財與無形資產管理', 'gray', 5)
ON CONFLICT ("name") DO NOTHING;
