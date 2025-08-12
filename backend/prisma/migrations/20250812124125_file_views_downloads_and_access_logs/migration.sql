/*
  Warnings:

  - Added the required column `type` to the `access_log` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "AccessType" AS ENUM ('VIEW', 'DOWNLOAD');

-- AlterTable
ALTER TABLE "Video" ALTER COLUMN "title" DROP NOT NULL;

-- AlterTable
ALTER TABLE "access_log" ADD COLUMN     "type" "AccessType" NOT NULL,
ADD COLUMN     "userId" INTEGER;

-- AlterTable
ALTER TABLE "file" ADD COLUMN     "downloads" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "views" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "access_log_fileId_type_accessTime_idx" ON "access_log"("fileId", "type", "accessTime");

-- AddForeignKey
ALTER TABLE "access_log" ADD CONSTRAINT "access_log_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
