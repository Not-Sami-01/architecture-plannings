-- AlterTable: Clerk-managed auth (fresh start — no linking of legacy rows)
ALTER TABLE "User" ADD COLUMN "clerkId" TEXT;
ALTER TABLE "User" DROP COLUMN "emailVerified",
  DROP COLUMN "passwordHash";

-- CreateIndex
CREATE UNIQUE INDEX "User_clerkId_key" ON "User"("clerkId");

-- DropTable: Auth.js adapter tables
DROP TABLE "Account";
DROP TABLE "Session";
DROP TABLE "VerificationToken";
