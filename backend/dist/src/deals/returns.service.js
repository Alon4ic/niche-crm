"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "ReturnsService", {
    enumerable: true,
    get: function() {
        return ReturnsService;
    }
});
const _common = require("@nestjs/common");
const _client = require("@prisma/client");
const _prismaservice = require("../prisma/prisma.service");
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
const DAY_MS = 24 * 60 * 60 * 1000;
let ReturnsService = class ReturnsService {
    async getDeal(tenantId, dealId) {
        const deal = await this.prisma.deal.findFirst({
            where: {
                id: dealId,
                tenantId
            },
            select: {
                id: true,
                stage: true,
                closedAt: true
            }
        });
        if (!deal) {
            throw new _common.NotFoundException("Deal not found");
        }
        return deal;
    }
    evaluateWindow(deal, windowDays) {
        if (deal.stage !== _client.DealStage.WON || !deal.closedAt) {
            return {
                ok: false,
                code: "RETURN_NOT_WON",
                deadline: null
            };
        }
        if (windowDays <= 0) {
            return {
                ok: false,
                code: "RETURNS_DISABLED",
                deadline: null
            };
        }
        const deadline = new Date(deal.closedAt.getTime() + windowDays * DAY_MS);
        if (new Date() > deadline) {
            return {
                ok: false,
                code: "RETURN_WINDOW_EXPIRED",
                deadline
            };
        }
        return {
            ok: true,
            code: null,
            deadline
        };
    }
    async computeReturnable(db, dealId) {
        const delivered = await db.stockReservation.groupBy({
            by: [
                "stockItemId"
            ],
            where: {
                dealId,
                status: "FULFILLED"
            },
            _sum: {
                quantity: true
            }
        });
        if (delivered.length === 0) return [];
        const ids = delivered.map((d)=>d.stockItemId);
        const returned = await db.dealReturnItem.groupBy({
            by: [
                "stockItemId"
            ],
            where: {
                stockItemId: {
                    in: ids
                },
                dealReturn: {
                    dealId
                }
            },
            _sum: {
                quantity: true
            }
        });
        const items = await db.stockItem.findMany({
            where: {
                id: {
                    in: ids
                }
            },
            select: {
                id: true,
                sku: true,
                name: true,
                unit: true
            }
        });
        return delivered.map((d)=>{
            const item = items.find((s)=>s.id === d.stockItemId);
            const deliveredQty = new _client.Prisma.Decimal(d._sum.quantity ?? 0);
            const returnedQty = new _client.Prisma.Decimal(returned.find((r)=>r.stockItemId === d.stockItemId)?._sum.quantity ?? 0);
            return {
                stockItemId: d.stockItemId,
                sku: item.sku,
                name: item.name,
                unit: item.unit,
                delivered: deliveredQty.toString(),
                returned: returnedQty.toString(),
                returnable: deliveredQty.minus(returnedQty).toString()
            };
        });
    }
    async list(tenantId, dealId) {
        const deal = await this.getDeal(tenantId, dealId);
        const { returnWindowDays } = await this.prisma.tenant.findUniqueOrThrow({
            where: {
                id: tenantId
            },
            select: {
                returnWindowDays: true
            }
        });
        const window = this.evaluateWindow(deal, returnWindowDays);
        const lines = await this.computeReturnable(this.prisma, dealId);
        const anyReturnable = lines.some((l)=>new _client.Prisma.Decimal(l.returnable).greaterThan(0));
        const blockedReason = window.code ?? (anyReturnable ? null : "NOTHING_TO_RETURN");
        const returns = await this.prisma.dealReturn.findMany({
            where: {
                dealId
            },
            orderBy: {
                createdAt: "desc"
            },
            include: {
                items: {
                    include: {
                        stockItem: {
                            select: {
                                sku: true,
                                name: true
                            }
                        }
                    }
                },
                createdBy: {
                    select: {
                        email: true
                    }
                }
            }
        });
        return {
            windowDays: returnWindowDays,
            deadline: window.deadline,
            eligible: blockedReason === null,
            blockedReason,
            lines,
            returns
        };
    }
    async create(tenantId, userId, dealId, dto) {
        await this.getDeal(tenantId, dealId);
        return this.prisma.$transaction(async (tx)=>{
            await tx.$queryRaw`SELECT id FROM "Deal" WHERE id = ${dealId} FOR UPDATE`;
            const deal = await tx.deal.findUniqueOrThrow({
                where: {
                    id: dealId
                },
                select: {
                    stage: true,
                    closedAt: true
                }
            });
            const { returnWindowDays } = await tx.tenant.findUniqueOrThrow({
                where: {
                    id: tenantId
                },
                select: {
                    returnWindowDays: true
                }
            });
            const window = this.evaluateWindow(deal, returnWindowDays);
            if (!window.ok) {
                throw new _common.ConflictException({
                    code: window.code,
                    message: "Return is not allowed for this deal"
                });
            }
            const lines = await this.computeReturnable(tx, dealId);
            const maxByItem = new Map(lines.map((l)=>[
                    l.stockItemId,
                    new _client.Prisma.Decimal(l.returnable)
                ]));
            const requested = new Map();
            for (const item of dto.items){
                const prev = requested.get(item.stockItemId) ?? new _client.Prisma.Decimal(0);
                requested.set(item.stockItemId, prev.plus(item.quantity));
            }
            for (const [stockItemId, qty] of requested){
                const max = maxByItem.get(stockItemId);
                if (!max) {
                    throw new _common.BadRequestException({
                        code: "RETURN_ITEM_NOT_IN_DEAL",
                        message: "This item was not delivered in this deal"
                    });
                }
                if (qty.greaterThan(max)) {
                    throw new _common.ConflictException({
                        code: "RETURN_EXCEEDS_DELIVERED",
                        message: "Quantity exceeds what can still be returned"
                    });
                }
            }
            const created = await tx.dealReturn.create({
                data: {
                    tenantId,
                    dealId,
                    createdById: userId,
                    reason: dto.reason,
                    items: {
                        create: dto.items.map((i)=>({
                                stockItemId: i.stockItemId,
                                quantity: i.quantity,
                                disposition: i.disposition
                            }))
                    }
                },
                include: {
                    items: true
                }
            });
            const restock = new Map();
            for (const i of dto.items){
                if (i.disposition === "RESTOCK") {
                    const prev = restock.get(i.stockItemId) ?? new _client.Prisma.Decimal(0);
                    restock.set(i.stockItemId, prev.plus(i.quantity));
                }
            }
            for (const stockItemId of [
                ...restock.keys()
            ].sort()){
                await tx.$executeRaw`
                    UPDATE "StockItem"
                    SET "quantityOnHand" = "quantityOnHand" + ${restock.get(stockItemId)}
                    WHERE id = ${stockItemId} AND "tenantId" = ${tenantId}
                `;
            }
            return created;
        });
    }
    constructor(prisma){
        this.prisma = prisma;
    }
};
ReturnsService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _prismaservice.PrismaService === "undefined" ? Object : _prismaservice.PrismaService
    ])
], ReturnsService);

//# sourceMappingURL=returns.service.js.map