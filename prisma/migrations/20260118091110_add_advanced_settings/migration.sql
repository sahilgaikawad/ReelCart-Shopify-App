-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AppSettings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "shop" TEXT NOT NULL,
    "instagramToken" TEXT,
    "primaryColor" TEXT NOT NULL DEFAULT '#000000',
    "buttonText" TEXT NOT NULL DEFAULT 'Add to Bag',
    "showViews" BOOLEAN NOT NULL DEFAULT true,
    "showRating" BOOLEAN NOT NULL DEFAULT true,
    "autoplay" BOOLEAN NOT NULL DEFAULT true,
    "borderRadius" INTEGER NOT NULL DEFAULT 12,
    "layoutType" TEXT NOT NULL DEFAULT 'slider',
    "enableGradient" BOOLEAN NOT NULL DEFAULT true,
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
    "customFont" TEXT NOT NULL DEFAULT 'inherit',
    "buttonAnimation" TEXT NOT NULL DEFAULT 'none',
    "showSaleBadge" BOOLEAN NOT NULL DEFAULT false,
    "startMuted" BOOLEAN NOT NULL DEFAULT true,
    "minimizeOnClose" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_AppSettings" ("autoplay", "borderRadius", "buttonText", "createdAt", "displayLocation", "enableGradient", "floatingBorderColor", "floatingBorderWidth", "floatingOverlayText", "floatingPlayerVisible", "floatingPosition", "floatingSize", "id", "instagramToken", "layoutType", "primaryColor", "shop", "showRating", "showViews", "updatedAt") SELECT "autoplay", "borderRadius", "buttonText", "createdAt", "displayLocation", "enableGradient", "floatingBorderColor", "floatingBorderWidth", "floatingOverlayText", "floatingPlayerVisible", "floatingPosition", "floatingSize", "id", "instagramToken", "layoutType", "primaryColor", "shop", "showRating", "showViews", "updatedAt" FROM "AppSettings";
DROP TABLE "AppSettings";
ALTER TABLE "new_AppSettings" RENAME TO "AppSettings";
CREATE UNIQUE INDEX "AppSettings_shop_key" ON "AppSettings"("shop");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
