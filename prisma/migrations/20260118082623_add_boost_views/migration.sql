-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Reel" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "shop" TEXT NOT NULL,
    "videoUrl" TEXT NOT NULL,
    "productId" TEXT,
    "variantId" TEXT,
    "productHandle" TEXT,
    "productTitle" TEXT,
    "productImage" TEXT,
    "brandName" TEXT DEFAULT 'Official Brand',
    "price" TEXT,
    "comparePrice" TEXT,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "views" INTEGER NOT NULL DEFAULT 0,
    "boostViews" INTEGER NOT NULL DEFAULT 0,
    "rating" TEXT DEFAULT '4.8',
    "source" TEXT DEFAULT 'manual',
    "isLive" BOOLEAN NOT NULL DEFAULT false,
    "instagramUrl" TEXT,
    "instagramId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Reel" ("brandName", "comparePrice", "createdAt", "id", "instagramId", "instagramUrl", "isLive", "likes", "price", "productHandle", "productId", "productImage", "productTitle", "rating", "shop", "source", "variantId", "videoUrl", "views") SELECT "brandName", "comparePrice", "createdAt", "id", "instagramId", "instagramUrl", "isLive", "likes", "price", "productHandle", "productId", "productImage", "productTitle", "rating", "shop", "source", "variantId", "videoUrl", "views" FROM "Reel";
DROP TABLE "Reel";
ALTER TABLE "new_Reel" RENAME TO "Reel";
CREATE UNIQUE INDEX "Reel_instagramId_key" ON "Reel"("instagramId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
