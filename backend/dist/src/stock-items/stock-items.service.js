"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "StockItemsService", {
    enumerable: true,
    get: function() {
        return StockItemsService;
    }
});
const _common = require("@nestjs/common");
const _prismaservice = require("../prisma/prisma.service");
const _client = require("@prisma/client");
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
let StockItemsService = class StockItemsService {
    withAvailable(item) {
        return {
            ...item,
            quantityAvailable: item.quantityOnHand.minus(item.quantityReserved)
        };
    }
    async create(tenantId, dto) {
        const item = await this.prisma.stockItem.create({
            data: {
                ...dto,
                quantityOnHand: dto.quantityOnHand ?? 0,
                tenantId
            }
        });
        return this.withAvailable(item);
    }
    async findAll(tenantId) {
        const items = await this.prisma.stockItem.findMany({
            where: {
                tenantId
            }
        });
        return items.map((item)=>this.withAvailable(item));
    }
    async findOne(tenantId, id) {
        const item = await this.prisma.stockItem.findFirst({
            where: {
                id,
                tenantId
            }
        });
        if (!item) {
            throw new _common.NotFoundException('Stock item not found');
        }
        return this.withAvailable(item);
    }
    async update(tenantId, id, dto) {
        return this.prisma.$transaction(async (tx)=>{
            const rows = await tx.$queryRaw`
                SELECT "quantityReserved" FROM "StockItem"
                WHERE id = ${id} AND "tenantId" = ${tenantId}
                FOR UPDATE
            `;
            if (rows.length === 0) {
                throw new _common.NotFoundException('Stock item not found');
            }
            if (dto.quantityOnHand !== undefined && new _client.Prisma.Decimal(dto.quantityOnHand).lessThan(new _client.Prisma.Decimal(rows[0].quantityReserved))) {
                throw new _common.ConflictException({
                    code: 'STOCK_BELOW_RESERVED',
                    message: "Quantity on hand cannot be lower than the reserved quantity"
                });
            }
            const item = await tx.stockItem.update({
                where: {
                    id
                },
                data: dto
            });
            return this.withAvailable(item);
        });
    }
    async remove(tenantId, id) {
        await this.findOne(tenantId, id);
        try {
            await this.prisma.stockItem.delete({
                where: {
                    id
                }
            });
        } catch (e) {
            if (e instanceof _client.Prisma.PrismaClientKnownRequestError && e.code === 'P2003') {
                throw new _common.ConflictException({
                    code: 'STOCK_ITEM_IN_USE',
                    message: 'Stock item is used in a deal and cannot be deleted'
                });
            }
            throw e;
        }
    }
    constructor(prisma){
        this.prisma = prisma;
    }
};
StockItemsService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _prismaservice.PrismaService === "undefined" ? Object : _prismaservice.PrismaService
    ])
], StockItemsService);

//# sourceMappingURL=stock-items.service.js.map