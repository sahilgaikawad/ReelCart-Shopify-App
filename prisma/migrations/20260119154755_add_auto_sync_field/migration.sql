/*
  Warnings:

  - You are about to drop the column `refreshToken` on the `Session` table. All the data in the column will be lost.
  - You are about to drop the column `refreshTokenExpires` on the `Session` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AppSettings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "shop" TEXT NOT NULL,
    "instagramToken" TEXT,
    "autoSync" BOOLEAN NOT NULL DEFAULT false,
    "primaryColor" TEXT NOT NULL DEFAULT '#000000',
    "buttonTextColor" TEXT NOT NULL DEFAULT '#ffffff',
    "buttonText" TEXT NOT NULL DEFAULT 'Add to Bag',
    "customFont" TEXT NOT NULL DEFAULT 'inherit',
    "cartAction" TEXT NOT NULL DEFAULT 'ajax',
    "floatingPlayerVisible" BOOLEAN NOT NULL DEFAULT true,
    "displayLocation" TEXT NOT NULL DEFAULT 'both',
    "floatingSize" INTEGER NOT NULL DEFAULT 150,
    "floatingPosition" TEXT NOT NULL DEFAULT 'bottom-right',
    "floatingBorderWidth" INTEGER NOT NULL DEFAULT 2,
    "floatingBorderColor" TEXT NOT NULL DEFAULT '#ffffff',
    "floatingOverlayText" TEXT NOT NULL DEFAULT 'Watch & Shop',
    "hideOnMobile" BOOLEAN NOT NULL DEFAULT false,
    "mobilePosition" TEXT NOT NULL DEFAULT 'bottom-center',
    "enableShadow" BOOLEAN NOT NULL DEFAULT true,
    "borderStyle" TEXT NOT NULL DEFAULT 'solid',
    "buttonAnimation" TEXT NOT NULL DEFAULT 'none',
    "showSaleBadge" BOOLEAN NOT NULL DEFAULT false,
    "startMuted" BOOLEAN NOT NULL DEFAULT true,
    "minimizeOnClose" BOOLEAN NOT NULL DEFAULT true,
    "widgetLayout" TEXT NOT NULL DEFAULT 'slider',
    "widgetAspectRatio" TEXT NOT NULL DEFAULT '9:16',
    "cardWidth" INTEGER NOT NULL DEFAULT 250,
    "sectionPadding" INTEGER NOT NULL DEFAULT 20,
    "sectionRadius" INTEGER NOT NULL DEFAULT 0,
    "itemsPerRow" INTEGER NOT NULL DEFAULT 4,
    "widgetHeading" TEXT NOT NULL DEFAULT 'Trending Reels',
    "widgetHeadingColor" TEXT NOT NULL DEFAULT '#000000',
    "widgetBackgroundColor" TEXT NOT NULL DEFAULT 'transparent',
    "cardBackgroundColor" TEXT NOT NULL DEFAULT '#ffffff',
    "widgetCornerRadius" INTEGER NOT NULL DEFAULT 12,
    "widgetGap" INTEGER NOT NULL DEFAULT 16,
    "showProductDetails" BOOLEAN NOT NULL DEFAULT true,
    "productTitleColor" TEXT NOT NULL DEFAULT '#333333',
    "productPriceColor" TEXT NOT NULL DEFAULT '#666666',
    "productTextSize" INTEGER NOT NULL DEFAULT 14,
    "showViews" BOOLEAN NOT NULL DEFAULT true,
    "showRating" BOOLEAN NOT NULL DEFAULT true,
    "autoplay" BOOLEAN NOT NULL DEFAULT true,
    "borderRadius" INTEGER NOT NULL DEFAULT 12,
    "layoutType" TEXT NOT NULL DEFAULT 'slider',
    "enableGradient" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_AppSettings" ("autoplay", "borderRadius", "borderStyle", "buttonAnimation", "buttonText", "buttonTextColor", "cardBackgroundColor", "cardWidth", "cartAction", "createdAt", "customFont", "displayLocation", "enableGradient", "enableShadow", "floatingBorderColor", "floatingBorderWidth", "floatingOverlayText", "floatingPlayerVisible", "floatingPosition", "floatingSize", "hideOnMobile", "id", "instagramToken", "itemsPerRow", "layoutType", "minimizeOnClose", "mobilePosition", "primaryColor", "productPriceColor", "productTextSize", "productTitleColor", "sectionPadding", "sectionRadius", "shop", "showProductDetails", "showRating", "showSaleBadge", "showViews", "startMuted", "updatedAt", "widgetAspectRatio", "widgetBackgroundColor", "widgetCornerRadius", "widgetGap", "widgetHeading", "widgetHeadingColor", "widgetLayout") SELECT "autoplay", "borderRadius", "borderStyle", "buttonAnimation", "buttonText", "buttonTextColor", "cardBackgroundColor", "cardWidth", "cartAction", "createdAt", "customFont", "displayLocation", "enableGradient", "enableShadow", "floatingBorderColor", "floatingBorderWidth", "floatingOverlayText", "floatingPlayerVisible", "floatingPosition", "floatingSize", "hideOnMobile", "id", "instagramToken", "itemsPerRow", "layoutType", "minimizeOnClose", "mobilePosition", "primaryColor", "productPriceColor", "productTextSize", "productTitleColor", "sectionPadding", "sectionRadius", "shop", "showProductDetails", "showRating", "showSaleBadge", "showViews", "startMuted", "updatedAt", "widgetAspectRatio", "widgetBackgroundColor", "widgetCornerRadius", "widgetGap", "widgetHeading", "widgetHeadingColor", "widgetLayout" FROM "AppSettings";
DROP TABLE "AppSettings";
ALTER TABLE "new_AppSettings" RENAME TO "AppSettings";
CREATE UNIQUE INDEX "AppSettings_shop_key" ON "AppSettings"("shop");
CREATE TABLE "new_Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "scope" TEXT,
    "expires" DATETIME,
    "accessToken" TEXT NOT NULL,
    "userId" BIGINT,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT,
    "accountOwner" BOOLEAN NOT NULL DEFAULT false,
    "locale" TEXT,
    "collaborator" BOOLEAN DEFAULT false,
    "emailVerified" BOOLEAN DEFAULT false
);
INSERT INTO "new_Session" ("accessToken", "accountOwner", "collaborator", "email", "emailVerified", "expires", "firstName", "id", "isOnline", "lastName", "locale", "scope", "shop", "state", "userId") SELECT "accessToken", "accountOwner", "collaborator", "email", "emailVerified", "expires", "firstName", "id", "isOnline", "lastName", "locale", "scope", "shop", "state", "userId" FROM "Session";
DROP TABLE "Session";
ALTER TABLE "new_Session" RENAME TO "Session";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
