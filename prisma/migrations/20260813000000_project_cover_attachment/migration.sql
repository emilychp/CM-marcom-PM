-- AlterTable
ALTER TABLE "Project" ADD COLUMN "coverAttachmentId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Project_coverAttachmentId_key" ON "Project"("coverAttachmentId");

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_coverAttachmentId_fkey" FOREIGN KEY ("coverAttachmentId") REFERENCES "Attachment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
