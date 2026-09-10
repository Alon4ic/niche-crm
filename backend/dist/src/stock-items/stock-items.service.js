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
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let StockItemsService = class StockItemsService {
    create(tenantId, dto) {
        return this.prisma.stockItem.create({
            data: {
                ...dto,
                quantityOnHand: dto.quantityOnHand ?? 0,
                tenantId
            }
        });
    }
    findAll(tenantId) {
        return this.prisma.stockItem.findMany({
            where: {
                tenantId
            }
        });
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
        return item;
    }
    async update(tenantId, id, dto) {
        await this.findOne(tenantId, id);
        return this.prisma.stockItem.update({
            where: {
                id
            },
            data: dto
        });
    }
    async remove(tenantId, id) {
        await this.findOne(tenantId, id);
        await this.prisma.stockItem.delete({
            where: {
                id
            }
        });
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