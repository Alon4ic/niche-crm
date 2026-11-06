"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "ImportsService", {
    enumerable: true,
    get: function() {
        return ImportsService;
    }
});
const _common = require("@nestjs/common");
const _client = require("@prisma/client");
const _prismaservice = require("../prisma/prisma.service");
const _parsers = require("./parsers");
const _numberutils = require("./number-utils");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") {
        r = Reflect.decorate(decorators, target, key, desc);
    } else {
        for(var i = decorators.length - 1; i >= 0; i--){
            if (d = decorators[i]) {
                r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
            }
        }
    }
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(metadataKey, metadataValue) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") {
        return Reflect.metadata(metadataKey, metadataValue);
    }
}
let ImportsService = class ImportsService {
    previewStockItems(buffer, mimetype, originalFileName) {
        const rows = (0, _parsers.parseFileToRows)(buffer, mimetype, originalFileName);
        if (rows.length === 0) {
            throw new _common.BadRequestException("File has no data rows");
        }
        return {
            headers: Object.keys(rows[0]),
            sampleRows: rows.slice(0, 20),
            totalRows: rows.length
        };
    }
    async commitStockItems(tenantId, buffer, mimetype, fileName, mapping) {
        const rows = (0, _parsers.parseFileToRows)(buffer, mimetype, fileName);
        const sourceType = fileName.toLowerCase().endsWith('.csv') ? _client.ImportSourceType.CSV : _client.ImportSourceType.EXCEL;
        const errors = [];
        let successCount = 0;
        for(let i = 0; i < rows.length; i++){
            const row = rows[i];
            const rowNumber = i + 2;
            const sku = row[mapping.sku]?.trim();
            const name = row[mapping.name]?.trim();
            const unit = row[mapping.unit]?.trim();
            const unitCostRaw = row[mapping.unitCost];
            const quantityRaw = mapping.quantityOnHand ? row[mapping.quantityOnHand] : undefined;
            if (!sku || !name || !unit) {
                errors.push({
                    row: rowNumber,
                    message: "Missing required field (SKU, name or unit)"
                });
                continue;
            }
            const unitCost = (0, _numberutils.parseLocalizedNumber)(unitCostRaw);
            if (unitCost === null || unitCost < 0) {
                errors.push({
                    row: rowNumber,
                    message: `Invalid unit cost: "${unitCostRaw}"`
                });
                continue;
            }
            let quantityOnHand;
            const hasQuantity = quantityRaw !== undefined && String(quantityRaw).trim() !== '';
            if (hasQuantity) {
                const parsed = (0, _numberutils.parseLocalizedNumber)(quantityRaw);
                if (parsed === null || parsed < 0) {
                    errors.push({
                        row: rowNumber,
                        message: `Invalid quantity: "${quantityRaw}`
                    });
                    continue;
                }
                quantityOnHand = parsed;
            }
            try {
                await this.prisma.stockItem.upsert({
                    where: {
                        tenantId_sku: {
                            tenantId,
                            sku
                        }
                    },
                    create: {
                        tenantId,
                        sku,
                        name,
                        unit,
                        unitCost,
                        quantityOnHand: quantityOnHand ?? 0
                    },
                    update: {
                        name,
                        unit,
                        unitCost,
                        ...quantityOnHand !== undefined ? {
                            quantityOnHand
                        } : {}
                    }
                });
                successCount++;
            } catch  {
                errors.push({
                    row: rowNumber,
                    message: "Database error while saving this row"
                });
            }
        }
        await this.prisma.importJob.create({
            data: {
                tenantId,
                entityType: _client.ImportEntityType.STOCK_ITEM,
                sourceType,
                status: _client.ImportStatus.COMPLETED,
                fileName,
                rowsTotal: rows.length,
                rowsSuccess: successCount,
                rowsFailed: errors.length,
                errors: errors.length > 0 ? errors : undefined,
                startedAt: new Date(),
                finishedAt: new Date()
            }
        });
        await this.prisma.importFieldMapping.upsert({
            where: {
                tenantId_entityType_sourceType: {
                    tenantId,
                    entityType: _client.ImportEntityType.STOCK_ITEM,
                    sourceType
                }
            },
            create: {
                tenantId,
                entityType: _client.ImportEntityType.STOCK_ITEM,
                sourceType,
                mapping: mapping
            },
            update: {
                mapping: mapping
            }
        });
        return {
            totalRows: rows.length,
            successCount,
            failedCount: errors.length,
            errors
        };
    }
    async getSavedMapping(tenantId, sourceType) {
        return this.prisma.importFieldMapping.findUnique({
            where: {
                tenantId_entityType_sourceType: {
                    tenantId,
                    entityType: _client.ImportEntityType.STOCK_ITEM,
                    sourceType
                }
            }
        });
    }
    constructor(prisma){
        this.prisma = prisma;
    }
};
ImportsService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _prismaservice.PrismaService === "undefined" ? Object : _prismaservice.PrismaService
    ])
], ImportsService);

//# sourceMappingURL=imports.service.js.map