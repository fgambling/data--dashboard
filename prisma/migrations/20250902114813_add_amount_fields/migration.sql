/*
  Warnings:

  - Added the required column `procurementAmount` to the `DailyData` table without a default value. This is not possible if the table is not empty.
  - Added the required column `salesAmount` to the `DailyData` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_DailyData" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "day" INTEGER NOT NULL,
    "inventory" INTEGER NOT NULL,
    "procurementQuantity" INTEGER NOT NULL,
    "procurementPrice" REAL NOT NULL,
    "procurementAmount" REAL NOT NULL,
    "salesQuantity" INTEGER NOT NULL,
    "salesPrice" REAL NOT NULL,
    "salesAmount" REAL NOT NULL,
    "productId" TEXT NOT NULL,
    CONSTRAINT "DailyData_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_DailyData" ("day", "id", "inventory", "procurementPrice", "procurementQuantity", "productId", "salesPrice", "salesQuantity") SELECT "day", "id", "inventory", "procurementPrice", "procurementQuantity", "productId", "salesPrice", "salesQuantity" FROM "DailyData";
DROP TABLE "DailyData";
ALTER TABLE "new_DailyData" RENAME TO "DailyData";
CREATE UNIQUE INDEX "DailyData_productId_day_key" ON "DailyData"("productId", "day");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
