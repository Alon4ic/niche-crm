-- CreateEnum
CREATE TYPE "ReturnDisposition" AS ENUM ('RESTOCK', 'WRITE_OFF');

-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "returnWindowDays" INTEGER NOT NULL DEFAULT 14;

-- CreateTable
CREATE TABLE "DealReturn" (
    "id" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tenantId" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "createdById" TEXT,

    CONSTRAINT "DealReturn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DealReturnItem" (
    "id" TEXT NOT NULL,
    "quantity" DECIMAL(12,3) NOT NULL,
    "disposition" "ReturnDisposition" NOT NULL,
    "dealReturnId" TEXT NOT NULL,
    "stockItemId" TEXT NOT NULL,

    CONSTRAINT "DealReturnItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DealReturn_tenantId_idx" ON "DealReturn"("tenantId");

-- CreateIndex
CREATE INDEX "DealReturn_dealId_idx" ON "DealReturn"("dealId");

-- CreateIndex
CREATE INDEX "DealReturnItem_dealReturnId_idx" ON "DealReturnItem"("dealReturnId");

-- CreateIndex
CREATE INDEX "DealReturnItem_stockItemId_idx" ON "DealReturnItem"("stockItemId");

-- AddForeignKey
ALTER TABLE "DealReturn" ADD CONSTRAINT "DealReturn_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealReturn" ADD CONSTRAINT "DealReturn_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealReturn" ADD CONSTRAINT "DealReturn_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealReturnItem" ADD CONSTRAINT "DealReturnItem_dealReturnId_fkey" FOREIGN KEY ("dealReturnId") REFERENCES "DealReturn"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealReturnItem" ADD CONSTRAINT "DealReturnItem_stockItemId_fkey" FOREIGN KEY ("stockItemId") REFERENCES "StockItem"("id") ON DELETE NO ACTION ON UPDATE CASCADE;
