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
    CONSTRAINT "DailyData_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_DailyData" ("day", "id", "inventory", "procurementAmount", "procurementPrice", "procurementQuantity", "productId", "salesAmount", "salesPrice", "salesQuantity") SELECT "day", "id", "inventory", "procurementAmount", "procurementPrice", "procurementQuantity", "productId", "salesAmount", "salesPrice", "salesQuantity" FROM "DailyData";
DROP TABLE "DailyData";
ALTER TABLE "new_DailyData" RENAME TO "DailyData";
CREATE UNIQUE INDEX "DailyData_productId_day_key" ON "DailyData"("productId", "day");
CREATE TABLE "new_Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "dataSetId" INTEGER NOT NULL,
    CONSTRAINT "Product_dataSetId_fkey" FOREIGN KEY ("dataSetId") REFERENCES "DataSet" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Product" ("dataSetId", "id", "name") SELECT "dataSetId", "id", "name" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
CREATE UNIQUE INDEX "Product_id_key" ON "Product"("id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
