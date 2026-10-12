-- App settings + currency snapshot + revision workflow (plan 3)
-- NOTE: "Order"."currency" is added nullable first, backfilled, then made
-- NOT NULL — the live DB already has rows.

-- AlterTable
ALTER TABLE "Order" ADD COLUMN "currency" TEXT;

-- Backfill existing orders with the previous hard-coded currency.
UPDATE "Order" SET "currency" = 'PKR' WHERE "currency" IS NULL;

ALTER TABLE "Order" ALTER COLUMN "currency" SET NOT NULL;

-- AlterTable
ALTER TABLE "Revision" ADD COLUMN     "acceptedAt" TIMESTAMP(3),
ADD COLUMN     "acceptedById" TEXT,
ADD COLUMN     "extraFeeRequired" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "SiteSetting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSetting_pkey" PRIMARY KEY ("key")
);

-- Seed the default currency (admins change it from /admin/settings).
INSERT INTO "SiteSetting" ("key", "value", "updatedAt") VALUES ('currency', 'PKR', CURRENT_TIMESTAMP);

-- CreateIndex
CREATE INDEX "Revision_orderId_idx" ON "Revision"("orderId");

-- AddForeignKey
ALTER TABLE "Revision" ADD CONSTRAINT "Revision_acceptedById_fkey" FOREIGN KEY ("acceptedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
