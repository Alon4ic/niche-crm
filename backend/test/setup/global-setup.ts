import * as dotenv from "dotenv";
import * as path from "path";
import { execSync } from "child_process";
import { PrismaClient } from "@prisma/client";

// Выполняется один раз перед всеми тестами
export default async function globalSetup() {
  dotenv.config({
    path: path.resolve(__dirname, "../../.env.test"),
    override: true,
    quiet: true,
  });

  const url = process.env.DATABASE_URL ?? "";
  const dbName = url.split("/").pop()?.split("?")[0] ?? "";
  // Предохранитель: тесты никогда не должны работать с рабочей базой
  if (!dbName.includes("test")) {
    throw new Error(
      `DATABASE_URL в .env.test указывает на базу "${dbName}". Тестовая база должна содержать "test" в имени.`,
    );
  }

  // Применяем миграции к тестовой базе
  execSync("npx prisma migrate deploy", { stdio: "inherit", env: process.env });

  // Чистим компании, оставшиеся от прошлого прогона (порядок важен: связи без каскада)
  const prisma = new PrismaClient();
  try {
    await prisma.$transaction([
      prisma.$executeRawUnsafe(
        `DELETE FROM "DealReturnItem" WHERE "stockItemId" IN (SELECT id FROM "StockItem" WHERE "tenantId" IN (SELECT id FROM "Tenant" WHERE name LIKE 'Test %'))`,
      ),
      prisma.$executeRawUnsafe(
        `DELETE FROM "DealReturn" WHERE "dealId" IN (SELECT id FROM "Deal" WHERE "tenantId" IN (SELECT id FROM "Tenant" WHERE name LIKE 'Test %'))`,
      ),
      prisma.$executeRawUnsafe(
        `DELETE FROM "Deal" WHERE "tenantId" IN (SELECT id FROM "Tenant" WHERE name LIKE 'Test %')`,
      ),
      prisma.$executeRawUnsafe(`DELETE FROM "Tenant" WHERE name LIKE 'Test %'`),
    ]);
  } finally {
    await prisma.$disconnect();
  }
}
