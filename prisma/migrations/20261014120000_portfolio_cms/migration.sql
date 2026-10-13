-- Portfolio CMS (Phase 5): gallery file kind + project description.
ALTER TYPE "FileKind" ADD VALUE IF NOT EXISTS 'PORTFOLIO_IMAGE';

-- AlterTable
ALTER TABLE "PortfolioProject" ADD COLUMN "description" TEXT;
