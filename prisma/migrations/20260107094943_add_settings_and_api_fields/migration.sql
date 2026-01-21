/*
  Warnings:

  - A unique constraint covering the columns `[instagramId]` on the table `Reel` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Reel" ADD COLUMN "instagramId" TEXT;

-- CreateTable
CREATE TABLE "AppSettings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "shop" TEXT NOT NULL,
    "primaryColor" TEXT NOT NULL DEFAULT '#000000',
    "buttonText" TEXT NOT NULL DEFAULT 'Add to Bag',
    "showViews" BOOLEAN NOT NULL DEFAULT true,
    "showRating" BOOLEAN NOT NULL DEFAULT true,
    "autoplay" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "AppSettings_shop_key" ON "AppSettings"("shop");

-- CreateIndex
CREATE UNIQUE INDEX "Reel_instagramId_key" ON "Reel"("instagramId");
