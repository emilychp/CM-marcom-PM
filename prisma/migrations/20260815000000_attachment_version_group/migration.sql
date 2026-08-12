-- AlterTable
ALTER TABLE "Attachment" ADD COLUMN "versionGroupId" TEXT;

-- CreateIndex
CREATE INDEX "Attachment_versionGroupId_idx" ON "Attachment"("versionGroupId");
