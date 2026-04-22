-- AlterTable
ALTER TABLE "FileItem" ADD COLUMN     "contentId" TEXT;

-- AddForeignKey
ALTER TABLE "FileItem" ADD CONSTRAINT "FileItem_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content"("id") ON DELETE SET NULL ON UPDATE CASCADE;
