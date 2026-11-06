/*
  Warnings:

  - A unique constraint covering the columns `[tenantId,entityType,sourceType]` on the table `ImportFieldMapping` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `entityType` to the `ImportFieldMapping` table without a default value. This is not possible if the table is not empty.
  - Added the required column `entityType` to the `ImportJob` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ImportEntityType" AS ENUM ('STOCK_ITEM', 'CLIENT');

-- DropIndex
DROP INDEX "ImportFieldMapping_tenantId_sourceType_key";

-- AlterTable
ALTER TABLE "ImportFieldMapping" ADD COLUMN     "entityType" "ImportEntityType" NOT NULL;

-- AlterTable
ALTER TABLE "ImportJob" ADD COLUMN     "entityType" "ImportEntityType" NOT NULL,
ADD COLUMN     "errors" JSONB;

-- CreateIndex
CREATE UNIQUE INDEX "ImportFieldMapping_tenantId_entityType_sourceType_key" ON "ImportFieldMapping"("tenantId", "entityType", "sourceType");
