-- CreateTable
CREATE TABLE "public"."DataSet" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DataSet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."User" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dataSetId" INTEGER NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DailyData" (
    "id" SERIAL NOT NULL,
    "day" INTEGER NOT NULL,
    "inventory" INTEGER NOT NULL,
    "procurementQuantity" INTEGER NOT NULL,
    "procurementPrice" DOUBLE PRECISION NOT NULL,
    "procurementAmount" DOUBLE PRECISION NOT NULL,
    "salesQuantity" INTEGER NOT NULL,
    "salesPrice" DOUBLE PRECISION NOT NULL,
    "salesAmount" DOUBLE PRECISION NOT NULL,
    "productId" TEXT NOT NULL,

    CONSTRAINT "DailyData_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "public"."User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Product_id_key" ON "public"."Product"("id");

-- CreateIndex
CREATE UNIQUE INDEX "DailyData_productId_day_key" ON "public"."DailyData"("productId", "day");

-- AddForeignKey
ALTER TABLE "public"."Product" ADD CONSTRAINT "Product_dataSetId_fkey" FOREIGN KEY ("dataSetId") REFERENCES "public"."DataSet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DailyData" ADD CONSTRAINT "DailyData_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
