-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AppSettings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "shop" TEXT NOT NULL,
    "instagramToken" TEXT,
    "primaryColor" TEXT NOT NULL DEFAULT '#000000',
    "buttonTextColor" TEXT NOT NULL DEFAULT '#ffffff',
    "buttonText" TEXT NOT NULL DEFAULT 'Add to Bag',
    "customFont" TEXT NOT NULL DEFAULT 'inherit',
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
INSERT INTO "new_AppSettings" ("autoplay", "borderRadius", "borderStyle", "buttonAnimation", "buttonText", "createdAt", "customFont", "displayLocation", "enableGradient", "enableShadow", "floatingBorderColor", "floatingBorderWidth", "floatingOverlayText", "floatingPlayerVisible", "floatingPosition", "floatingSize", "hideOnMobile", "id", "instagramToken", "layoutType", "minimizeOnClose", "mobilePosition", "primaryColor", "shop", "showRating", "showSaleBadge", "showViews", "startMuted", "updatedAt") SELECT "autoplay", "borderRadius", "borderStyle", "buttonAnimation", "buttonText", "createdAt", "customFont", "displayLocation", "enableGradient", "enableShadow", "floatingBorderColor", "floatingBorderWidth", "floatingOverlayText", "floatingPlayerVisible", "floatingPosition", "floatingSize", "hideOnMobile", "id", "instagramToken", "layoutType", "minimizeOnClose", "mobilePosition", "primaryColor", "shop", "showRating", "showSaleBadge", "showViews", "startMuted", "updatedAt" FROM "AppSettings";
DROP TABLE "AppSettings";
ALTER TABLE "new_AppSettings" RENAME TO "AppSettings";
CREATE UNIQUE INDEX "AppSettings_shop_key" ON "AppSettings"("shop");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
