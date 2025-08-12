/*
  Warnings:

  - You are about to drop the column `accessTime` on the `access_log` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "access_log_fileId_type_accessTime_idx";

-- AlterTable
ALTER TABLE "access_log" DROP COLUMN "accessTime",
ADD COLUMN     "accessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "access_log_fileId_type_accessedAt_idx" ON "access_log"("fileId", "type", "accessedAt");
