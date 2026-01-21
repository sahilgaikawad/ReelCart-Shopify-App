-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Reel" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "shop" TEXT NOT NULL,
    "videoUrl" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT,
    "productHandle" TEXT NOT NULL,
    "productTitle" TEXT,
    "productImage" TEXT,
    "brandName" TEXT DEFAULT 'Brand Name',
    "price" TEXT,
    "comparePrice" TEXT,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "views" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Reel" ("brandName", "comparePrice", "createdAt", "id", "likes", "price", "productHandle", "productId", "productTitle", "shop", "variantId", "videoUrl") SELECT "brandName", "comparePrice", "createdAt", "id", "likes", "price", "productHandle", "productId", "productTitle", "shop", "variantId", "videoUrl" FROM "Reel";
DROP TABLE "Reel";
ALTER TABLE "new_Reel" RENAME TO "Reel";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
