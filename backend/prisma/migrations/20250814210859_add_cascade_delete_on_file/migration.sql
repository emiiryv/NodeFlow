-- DropForeignKey
ALTER TABLE "Video" DROP CONSTRAINT "Video_fileId_fkey";

-- DropForeignKey
ALTER TABLE "access_log" DROP CONSTRAINT "access_log_fileId_fkey";

-- AddForeignKey
ALTER TABLE "Video" ADD CONSTRAINT "Video_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "file"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_log" ADD CONSTRAINT "access_log_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "file"("id") ON DELETE CASCADE ON UPDATE CASCADE;
