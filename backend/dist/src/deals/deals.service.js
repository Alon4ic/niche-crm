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
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let DealsService = class DealsService {
    async create(tenantId, dto) {
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
                stockReservations: true
            }
        });
        if (!deal) {
            throw new _common.NotFoundException("Deal not found");
        }
        return deal;
    }
    async updateStage(tenantId, dealId, newStage) {
        const deal = await this.findOne(tenantId, dealId);
        return this.prisma.$transaction(async (tx)=>{
            await tx.dealStageHistory.updateMany({
                where: {
                    dealId,
                    exitedAt: null
                },
                data: {
                    ExitedAt: new Date()
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
        return this.prisma.dealBomItem.create({
            data: {
                dealId,
                stockItemId: dto.stockItemId,
                quantity: dto.quantity,
                unitCostSnapshot: stockItem.unitCost
            }
        });
    }
    async removeBomItem(tenantId, dealId, bomItemId) {
        await this.assertDealBelongsToTenant(tenantId, dealId);
        await this.prisma.dealBomItem.deleteMany({
            where: {
                id: bomItemId,
                dealId
            }
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
        const bomItems = await this.prisma.dealBomItem.findMany({
            where: {
                dealId
            }
        });
        if (bomItems.length === 0) {
            throw new _common.BadRequestException("Deal has no BOM items to reserve");
        }
        return this.prisma.$transaction(async (tx)=>{
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
                        status: "RESERVED"
                    }
                });
            }
            return {
                dealId,
                reservedItems: bomItems.length
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
            throw new _common.NotFoundException('Deal not found');
        }
        const contact = await this.prisma.contact.findFirst({
            where: {
                id: dto.contactId,
                tenantId
            }
        });
        if (!contact) {
            throw new _common.NotFoundException('Contact not found');
        }
        if (contact.clientId !== deal.clientId) {
            throw new _common.BadRequestException('Contact does not belong to the deal\'s client');
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
            if (error instanceof _client.Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
                throw new _common.NotFoundException('This contact is not linked to the deal');
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
    constructor(prisma){
        this.prisma = prisma;
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