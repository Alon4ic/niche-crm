import { Injectable, BadRequestException } from "@nestjs/common";
import {
  ImportEntityType,
  ImportSourceType,
  ImportStatus,
  Prisma,
} from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { parseFileToRows } from "./parsers";
import { StockItemColumnMappingDto } from "./dto/column-mapping.dto";
import { parseLocalizedNumber } from "./number-utils";

export interface RowError {
  row: number;
  message: string;
}

@Injectable()
export class ImportsService {
  constructor(private readonly prisma: PrismaService) {}

  previewStockItems(
    buffer: Buffer,
    mimetype: string,
    originalFileName: string,
  ) {
    const rows = parseFileToRows(buffer, mimetype, originalFileName);
    if (rows.length === 0) {
      throw new BadRequestException("File has no data rows");
    }
    return {
      headers: Object.keys(rows[0]),
      sampleRows: rows.slice(0, 20),
      totalRows: rows.length,
    };
  }
  async commitStockItems(
    tenantId: string,
    buffer: Buffer,
    mimetype: string,
    fileName: string,
    mapping: StockItemColumnMappingDto,
  ) {
    const rows = parseFileToRows(buffer, mimetype, fileName);
    const sourceType: ImportSourceType =
      fileName.toLowerCase().endsWith('.csv') ? ImportSourceType.CSV : ImportSourceType.EXCEL;

    const errors: RowError[] = [];
    let successCount = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 2;

      const sku = row[mapping.sku]?.trim();
      const name = row[mapping.name]?.trim();
      const unit = row[mapping.unit]?.trim();
      const unitCostRaw = row[mapping.unitCost];
      const quantityRaw = mapping.quantityOnHand
        ? row[mapping.quantityOnHand]
        : undefined;

      if (!sku || !name || !unit) {
        errors.push({
          row: rowNumber,
          message: "Missing required field (SKU, name or unit)",
        });
        continue;
      }

      const unitCost = parseLocalizedNumber(unitCostRaw);
      if (unitCost === null || unitCost < 0) {
        errors.push({
          row: rowNumber,
          message: `Invalid unit cost: "${unitCostRaw}"`,
        });
        continue;
      }

      let quantityOnHand: number | undefined;
      const hasQuantity = quantityRaw !== undefined && String(quantityRaw).trim() !== '';
      if (hasQuantity) {
        const parsed = parseLocalizedNumber(quantityRaw);
        if (parsed === null || parsed < 0) {
            errors.push({
              row: rowNumber,
              message: `Invalid quantity: "${quantityRaw}`,
            });
            continue;
        }
        quantityOnHand = parsed;
      
      }

      try {
        await this.prisma.stockItem.upsert({
          where: { tenantId_sku: { tenantId, sku } },
          create: {
            tenantId,
            sku,
            name,
            unit,
            unitCost,
            quantityOnHand: quantityOnHand ?? 0,
          },
          update: {
            name,
            unit,
            unitCost,
            ...(quantityOnHand !== undefined ? { quantityOnHand } : {}),
          },
        });
        successCount++;
      } catch {
        errors.push({
          row: rowNumber,
          message: "Database error while saving this row",
        });
      }
    }
    await this.prisma.importJob.create({
      data: {
        tenantId,
        entityType: ImportEntityType.STOCK_ITEM,
        sourceType,
        status: ImportStatus.COMPLETED,
        fileName,
        rowsTotal: rows.length,
        rowsSuccess: successCount,
        rowsFailed: errors.length,
        errors:
          errors.length > 0
            ? (errors as unknown as Prisma.InputJsonValue)
            : undefined,
        startedAt: new Date(),
        finishedAt: new Date(),
      },
    });

    await this.prisma.importFieldMapping.upsert({
      where: {
        tenantId_entityType_sourceType: {
          tenantId,
          entityType: ImportEntityType.STOCK_ITEM,
          sourceType,
        },
      },
      create: {
        tenantId,
        entityType: ImportEntityType.STOCK_ITEM,
        sourceType,
        mapping: mapping as unknown as Prisma.InputJsonValue,
      },
      update: { mapping: mapping as unknown as Prisma.InputJsonValue },
    });
    return {
      totalRows: rows.length,
      successCount,
      failedCount: errors.length,
      errors,
    };
  }
  async getSavedMapping(tenantId: string, sourceType: ImportSourceType) {
    return this.prisma.importFieldMapping.findUnique({
      where: {
        tenantId_entityType_sourceType: {
          tenantId,
          entityType: ImportEntityType.STOCK_ITEM,
          sourceType,
        },
      },
    });
  }
}
