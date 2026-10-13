-- AlterTable
ALTER TABLE "OrderFile" ADD COLUMN     "seenAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Package" ADD COLUMN     "imageKey" TEXT;
