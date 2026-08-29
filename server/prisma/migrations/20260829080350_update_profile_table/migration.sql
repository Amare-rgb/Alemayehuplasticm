/*
  Warnings:

  - You are about to drop the column `condition` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `sellerId` on the `products` table. All the data in the column will be lost.
  - You are about to drop the `profiles` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "ProductVisibility" AS ENUM ('VISIBLE', 'HIDDEN');

-- CreateEnum
CREATE TYPE "ArticleStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- AlterEnum
ALTER TYPE "CategoryStatus" ADD VALUE 'HIDDEN';

-- DropForeignKey
ALTER TABLE "products" DROP CONSTRAINT "products_sellerId_fkey";

-- DropForeignKey
ALTER TABLE "profiles" DROP CONSTRAINT "profiles_userId_fkey";

-- DropIndex
DROP INDEX "products_sellerId_idx";

-- AlterTable
ALTER TABLE "products" DROP COLUMN "condition",
DROP COLUMN "sellerId",
ADD COLUMN     "visibility" "ProductVisibility" NOT NULL DEFAULT 'VISIBLE';

-- AlterTable
ALTER TABLE "settings" ADD COLUMN     "contactAddress" TEXT DEFAULT '123 Agriculture Way, Farming District, FC 12345',
ADD COLUMN     "contactEmail" TEXT DEFAULT 'support@genesisagri.com',
ADD COLUMN     "contactHours" TEXT DEFAULT 'Mon-Fri: 8:00 AM - 6:00 PM',
ADD COLUMN     "contactMapEmbed" TEXT DEFAULT '',
ADD COLUMN     "contactPhone" TEXT DEFAULT '+1 (555) 123-4567',
ADD COLUMN     "emergencyPhone" TEXT DEFAULT '+1 (555) 999-9999',
ADD COLUMN     "enableContactForm" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "enableLiveChat" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "enableWhatsApp" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "infoEmail" TEXT DEFAULT 'info@genesisagri.com',
ADD COLUMN     "supportEmail" TEXT DEFAULT 'support@genesisagri.com',
ADD COLUMN     "whatsAppNumber" TEXT DEFAULT '+254700000000',
ALTER COLUMN "logo" SET DEFAULT '',
ALTER COLUMN "favicon" SET DEFAULT '';

-- DropTable
DROP TABLE "profiles";

-- DropEnum
DROP TYPE "ProductCondition";

-- CreateTable
CREATE TABLE "admin_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "permissions" TEXT[],
    "department" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "articles" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "summary" TEXT,
    "content" TEXT NOT NULL,
    "note" TEXT,
    "pdfUrl" TEXT NOT NULL,
    "pdfFileName" TEXT NOT NULL,
    "pdfFileSize" INTEGER NOT NULL,
    "status" "ArticleStatus" NOT NULL DEFAULT 'PUBLISHED',
    "views" INTEGER NOT NULL DEFAULT 0,
    "downloads" INTEGER NOT NULL DEFAULT 0,
    "tags" TEXT[],
    "createdBy" TEXT,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "articles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admin_profiles_userId_key" ON "admin_profiles"("userId");

-- CreateIndex
CREATE INDEX "articles_status_createdAt_idx" ON "articles"("status", "createdAt");

-- CreateIndex
CREATE INDEX "articles_author_idx" ON "articles"("author");

-- CreateIndex
CREATE INDEX "articles_createdBy_idx" ON "articles"("createdBy");

-- CreateIndex
CREATE INDEX "products_visibility_idx" ON "products"("visibility");

-- AddForeignKey
ALTER TABLE "admin_profiles" ADD CONSTRAINT "admin_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "articles" ADD CONSTRAINT "articles_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
