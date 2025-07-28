/*
  Warnings:

  - You are about to drop the column `createdAt` on the `video` table. All the data in the column will be lost.
  - Added the required column `filename` to the `video` table without a default value. This is not possible if the table is not empty.
  - Added the required column `size` to the `video` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `video` table without a default value. This is not possible if the table is not empty.
  - Added the required column `url` to the `video` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "video" DROP COLUMN "createdAt",
ADD COLUMN     "description" TEXT,
ADD COLUMN     "filename" TEXT NOT NULL,
ADD COLUMN     "size" INTEGER NOT NULL,
ADD COLUMN     "tenantId" INTEGER,
ADD COLUMN     "title" TEXT NOT NULL,
ADD COLUMN     "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "uploadedBy" INTEGER,
ADD COLUMN     "url" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "video" ADD CONSTRAINT "video_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video" ADD CONSTRAINT "video_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
