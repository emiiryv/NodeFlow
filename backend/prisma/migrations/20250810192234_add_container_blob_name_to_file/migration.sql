/*
  Warnings:

  - Made the column `size` on table `file` required. This step will fail if there are existing NULL values in that column.
  - Made the column `uploaderIp` on table `file` required. This step will fail if there are existing NULL values in that column.
  - Made the column `userId` on table `file` required. This step will fail if there are existing NULL values in that column.
  - Made the column `tenantId` on table `file` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "file" DROP CONSTRAINT "file_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "file" DROP CONSTRAINT "file_userId_fkey";

-- AlterTable
ALTER TABLE "file" ADD COLUMN     "blobName" TEXT,
ADD COLUMN     "container" TEXT,
ALTER COLUMN "size" SET NOT NULL,
ALTER COLUMN "uploaderIp" SET NOT NULL,
ALTER COLUMN "userId" SET NOT NULL,
ALTER COLUMN "tenantId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "file" ADD CONSTRAINT "file_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file" ADD CONSTRAINT "file_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
