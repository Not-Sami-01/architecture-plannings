-- AlterEnum
ALTER TYPE "FileKind" ADD VALUE 'CHAT_ATTACHMENT';

-- DropIndex
DROP INDEX "Message_orderId_idx";

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "editedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "assignedToId" TEXT;

-- AlterTable
ALTER TABLE "OrderFile" ADD COLUMN     "messageId" TEXT;

-- CreateIndex
CREATE INDEX "Message_orderId_createdAt_idx" ON "Message"("orderId", "createdAt");

-- CreateIndex
CREATE INDEX "Order_assignedToId_idx" ON "Order"("assignedToId");

-- CreateIndex
CREATE INDEX "OrderFile_kind_idx" ON "OrderFile"("kind");

-- CreateIndex
CREATE INDEX "OrderFile_messageId_idx" ON "OrderFile"("messageId");

-- CreateIndex
CREATE INDEX "OrderFile_uploadedById_idx" ON "OrderFile"("uploadedById");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderFile" ADD CONSTRAINT "OrderFile_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE SET NULL ON UPDATE CASCADE;
