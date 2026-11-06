"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "DealsService", {
    enumerable: true,
    get: function() {
        return DealsService;
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
let DealsService = class DealsService {
    async create(tenantId, dto) {
        const client = await this.prisma.client.findFirst({
            where: {
                id: dto.clientId,
                tenantId
            },
            select: {
                id: true
            }
        });
        if (!client) {
            throw new _common.NotFoundException('Client not found');
        }
        return this.prisma.deal.create({
            data: {
                title: dto.title,
                clientId: dto.clientId,
                value: dto.value,
                currency: dto.currency ?? "USD",
                tenantId,
                stageHistory: {
                    create: {
                        stage: _client.DealStage.LEAD
                    }
                }
            }
        });
    }
    findAll(tenantId) {
        return this.prisma.deal.findMany({
            where: {
                tenantId
            },
            include: {
                client: true
            }
        });
    }
    async findOne(tenantId, dealId) {
        const deal = await this.prisma.deal.findFirst({
            where: {
                id: dealId,
                tenantId
            },
            include: {
                client: true,
                bomItems: {
                    include: {
                        stockItem: true
                    }
                },
                stockReservations: true,
                dealContacts: {
                    include: {
                        contact: true
                    }
                }
            }
        });
        if (!deal) {
            throw new _common.NotFoundException("Deal not found");
        }
        return deal;
    }
    async updateStage(tenantId, dealId, newStage) {
        await this.assertDealBelongsToTenant(tenantId, dealId);
        return this.prisma.$transaction(async (tx)=>{
            await this.lockDeal(tx, dealId);
            const deal = await tx.deal.findUniqueOrThrow({
                where: {
                    id: dealId
                }
            });
            if (deal.stage === newStage) {
                return deal;
            }
            if (deal.stage === _client.DealStage.WON) {
                const fulfilled = await tx.stockReservation.count({
                    where: {
                        dealId,
                        status: 'FULFILLED'
                    }
                });
                if (fulfilled > 0) {
                    throw new _common.ConflictException({
                        code: 'WON_IS_FINAL',
                        message: 'A Won deal cannot be reopened: its stock has been deducted'
                    });
                }
            }
            if (newStage === _client.DealStage.WON) {
                const hasBom = await tx.dealBomItem.count({
                    where: {
                        dealId
                    }
                }) > 0;
                if (hasBom) {
                    const reserved = await tx.stockReservation.count({
                        where: {
                            dealId,
                            status: 'RESERVED'
                        }
                    });
                    if (reserved === 0) {
                        throw new _common.ConflictException({
                            code: 'STAGE_NEEDS_RESERVATION',
                            message: "Reserve the stock before marking the deal as Won"
                        });
                    }
                    await this.fulfillActiveReservations(tx, tenantId, dealId);
                }
            }
            if (newStage === _client.DealStage.LOST) {
                await this.releaseActiveReservations(tx, tenantId, dealId);
            }
            await tx.dealStageHistory.updateMany({
                where: {
                    dealId,
                    exitedAt: null
                },
                data: {
                    exitedAt: new Date()
                }
            });
            await tx.dealStageHistory.create({
                data: {
                    dealId,
                    stage: newStage
                }
            });
            return tx.deal.update({
                where: {
                    id: dealId
                },
                data: {
                    stage: newStage,
                    closedAt: newStage === _client.DealStage.WON || newStage === _client.DealStage.LOST ? new Date() : deal.closedAt
                }
            });
        });
    }
    async getFunnelAnalytics(tenantId) {
        const stageCounts = await this.prisma.deal.groupBy({
            by: [
                "stage"
            ],
            where: {
                tenantId
            },
            _count: {
                _all: true
            },
            _sum: {
                value: true
            }
        });
        const avgDaysRaw = await this.prisma.$queryRaw`
  SELECT dsh.stage, AVG(EXTRACT(EPOCH FROM (dsh."exitedAt" - dsh."enteredAt")) / 86400.0) as "avgDays"
  FROM "DealStageHistory" dsh
  JOIN "Deal" d ON d.id = dsh."dealId"
  WHERE dsh."exitedAt" IS NOT NULL AND d."tenantId" = ${tenantId}
  GROUP BY dsh.stage
`;
        const stages = this.ALL_STAGES.map((stage)=>{
            const countRow = stageCounts.find((s)=>s.stage === stage);
            const avgRow = avgDaysRaw.find((a)=>a.stage === stage);
            return {
                stage,
                count: countRow?._count._all ?? 0,
                totalValue: Number(countRow?._sum.value ?? 0),
                avgDaysInStage: avgRow?.avgDays != null ? Number(avgRow.avgDays) : null
            };
        });
        const totalDeals = stages.reduce((sum, s)=>sum + s.count, 0);
        const wonCount = stages.find((s)=>s.stage === "WON")?.count ?? 0;
        const lostCount = stages.find((s)=>s.stage === "LOST")?.count ?? 0;
        const closedCount = wonCount + lostCount;
        const winRatePercent = closedCount > 0 ? wonCount / closedCount * 100 : null;
        return {
            stages,
            totalDeals,
            wonCount,
            lostCount,
            winRatePercent
        };
    }
    async addBomItem(tenantId, dealId, dto) {
        await this.assertDealBelongsToTenant(tenantId, dealId);
        const stockItem = await this.prisma.stockItem.findFirst({
            where: {
                id: dto.stockItemId,
                tenantId
            }
        });
        if (!stockItem) {
            throw new _common.NotFoundException("Stock item not found");
        }
        return this.prisma.$transaction(async (tx)=>{
            await this.lockDeal(tx, dealId);
            await this.assertBomEditable(tx, dealId);
            return tx.dealBomItem.create({
                data: {
                    dealId,
                    stockItemId: dto.stockItemId,
                    quantity: dto.quantity,
                    unitCostSnapshot: stockItem.unitCost
                }
            });
        });
    }
    async removeBomItem(tenantId, dealId, bomItemId) {
        await this.assertDealBelongsToTenant(tenantId, dealId);
        await this.prisma.$transaction(async (tx)=>{
            await this.lockDeal(tx, dealId);
            await this.assertBomEditable(tx, dealId);
            await tx.dealBomItem.deleteMany({
                where: {
                    id: bomItemId,
                    dealId
                }
            });
        });
    }
    async getCost(tenantId, dealId) {
        await this.assertDealBelongsToTenant(tenantId, dealId);
        const items = await this.prisma.dealBomItem.findMany({
            where: {
                dealId
            }
        });
        const totalCost = items.reduce((sum, item)=>sum + Number(item.quantity) * Number(item.unitCostSnapshot), 0);
        return {
            dealId,
            itemsCount: items.length,
            totalCost
        };
    }
    async reserveStock(tenantId, dealId) {
        await this.assertDealBelongsToTenant(tenantId, dealId);
        return this.prisma.$transaction(async (tx)=>{
            await this.lockDeal(tx, dealId);
            const deal = await tx.deal.findUniqueOrThrow({
                where: {
                    id: dealId
                }
            });
            if (deal.stage === _client.DealStage.WON || deal.stage === _client.DealStage.LOST) {
                throw new _common.ConflictException({
                    code: 'DEAL_CLOSED',
                    message: 'Reopen the deal before reserving stock'
                });
            }
            const alreadyReserved = await tx.stockReservation.count({
                where: {
                    dealId,
                    status: 'RESERVED'
                }
            });
            if (alreadyReserved > 0) {
                throw new _common.ConflictException({
                    code: 'ALREADY_RESERVED',
                    message: 'Stock is already reserved for this deal'
                });
            }
            const bomItems = await this.prisma.dealBomItem.findMany({
                where: {
                    dealId
                }
            });
            if (bomItems.length === 0) {
                throw new _common.BadRequestException("Deal has no BOM items to reserve");
            }
            for (const item of bomItems){
                const result = await tx.$queryRaw`
          UPDATE "StockItem"
          SET "quantityReserved" = "quantityReserved" + ${item.quantity}
          WHERE id = ${item.stockItemId}
            AND "tenantId" = ${tenantId}
            AND "quantityOnHand" - "quantityReserved" >= ${item.quantity}
          RETURNING 1 as count
        `;
                if (result.length === 0) {
                    throw new _common.BadRequestException(`Insufficient stock for item ${item.stockItemId}`);
                }
                await tx.stockReservation.create({
                    data: {
                        dealId,
                        stockItemId: item.stockItemId,
                        quantity: item.quantity,
                        status: 'RESERVED'
                    }
                });
            }
            return {
                dealId,
                reservedItems: bomItems.length
            };
        });
    }
    async releaseReservation(tenantId, dealId) {
        await this.assertDealBelongsToTenant(tenantId, dealId);
        return this.prisma.$transaction(async (tx)=>{
            await this.lockDeal(tx, dealId);
            const released = await this.releaseActiveReservations(tx, tenantId, dealId);
            if (released === 0) {
                throw new _common.BadRequestException('No active reservations for this deal');
            }
            return {
                dealId,
                releasedItems: released
            };
        });
    }
    async addContact(tenantId, dealId, dto) {
        const deal = await this.prisma.deal.findFirst({
            where: {
                id: dealId,
                tenantId
            }
        });
        if (!deal) {
            throw new _common.NotFoundException("Deal not found");
        }
        const contact = await this.prisma.contact.findFirst({
            where: {
                id: dto.contactId,
                tenantId
            }
        });
        if (!contact) {
            throw new _common.NotFoundException("Contact not found");
        }
        if (contact.clientId !== deal.clientId) {
            throw new _common.BadRequestException("Contact does not belong to the deal's client");
        }
        return this.prisma.dealContact.create({
            data: {
                dealId,
                contactId: dto.contactId,
                roleInDeal: dto.roleInDeal
            }
        });
    }
    async removeContact(tenantId, dealId, contactId) {
        await this.assertDealBelongsToTenant(tenantId, dealId);
        try {
            await this.prisma.dealContact.delete({
                where: {
                    dealId_contactId: {
                        dealId,
                        contactId
                    }
                }
            });
        } catch (error) {
            if (error instanceof _client.Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
                throw new _common.NotFoundException("This contact is not linked to the deal");
            }
            throw error;
        }
    }
    async assertDealBelongsToTenant(tenantId, dealId) {
        const deal = await this.prisma.deal.findFirst({
            where: {
                id: dealId,
                tenantId
            }
        });
        if (!deal) {
            throw new _common.NotFoundException("Deal not found");
        }
    }
    async lockDeal(tx, dealId) {
        await tx.$queryRaw`SELECT id FROM "Deal" WHERE id = ${dealId} FOR UPDATE`;
    }
    async assertNoActiveReservation(tx, dealId) {
        const active = await tx.stockReservation.count({
            where: {
                dealId,
                status: 'RESERVED'
            }
        });
        if (active > 0) {
            throw new _common.ConflictException('Release the stock reservation before changing the BOM');
        }
    }
    async assertBomEditable(tx, dealId) {
        const deal = await tx.deal.findUniqueOrThrow({
            where: {
                id: dealId
            },
            select: {
                stage: true
            }
        });
        if (deal.stage === _client.DealStage.WON) {
            throw new _common.ConflictException({
                code: 'BOM_LOCKED_WON',
                message: 'The BOM of a Won deal cannot be changed'
            });
        }
        const active = await tx.stockReservation.count({
            where: {
                dealId,
                status: 'RESERVED'
            }
        });
        if (active > 0) {
            throw new _common.ConflictException({
                code: 'BOM_LOCKED_RESERVED',
                message: 'Release the stock reservation before changing the BOM'
            });
        }
    }
    async releaseActiveReservations(tx, tenantId, dealId) {
        const active = await tx.stockReservation.findMany({
            where: {
                dealId,
                status: 'RESERVED'
            },
            orderBy: {
                stockItemId: 'asc'
            }
        });
        for (const r of active){
            await tx.$executeRaw`
        UPDATE "StockItem"
        SET "quantityReserved" = "quantityReserved" - ${r.quantity}
        WHERE id = ${r.stockItemId} AND "tenantId" = ${tenantId}
      `;
        }
        if (active.length > 0) {
            await tx.stockReservation.updateMany({
                where: {
                    dealId,
                    status: 'RESERVED'
                },
                data: {
                    status: 'RELEASED'
                }
            });
        }
        return active.length;
    }
    async fulfillActiveReservations(tx, tenantId, dealId) {
        const active = await tx.stockReservation.findMany({
            where: {
                dealId,
                status: 'RESERVED'
            },
            orderBy: {
                stockItemId: 'asc'
            }
        });
        for (const r of active){
            const updated = await tx.$queryRaw`
        UPDATE "StockItem"
        SET "quantityOnHand" = "quantityOnHand" - ${r.quantity},
            "quantityReserved" = "quantityReserved" - ${r.quantity}
        WHERE id = ${r.stockItemId}
          AND "tenantId" = ${tenantId}
          AND "quantityOnHand" >= ${r.quantity}
          AND "quantityReserved" >= ${r.quantity}
        RETURNING 1 as count
      `;
            if (updated.length === 0) {
                throw new _common.ConflictException({
                    code: 'STOCK_CHANGED',
                    message: 'Stock changed after the reservation and cannot be deducted'
                });
            }
        }
        await tx.stockReservation.updateMany({
            where: {
                dealId,
                status: 'RESERVED'
            },
            data: {
                status: 'FULFILLED'
            }
        });
        return active.length;
    }
    constructor(prisma){
        this.prisma = prisma;
        this.ALL_STAGES = [
            _client.DealStage.LEAD,
            _client.DealStage.QUALIFIED,
            _client.DealStage.PROPOSAL,
            _client.DealStage.NEGOTIATION,
            _client.DealStage.WON,
            _client.DealStage.LOST
        ];
    }
};
DealsService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _prismaservice.PrismaService === "undefined" ? Object : _prismaservice.PrismaService
    ])
], DealsService);

//# sourceMappingURL=deals.service.js.map