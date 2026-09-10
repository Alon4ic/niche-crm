import { BadRequestException, NotFoundException } from "@nestjs/common";
import { Injectable } from "@nestjs/common";
import { DealStage } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateDealDto } from "./dto/create-deal.dto";
import { AddBomItemDto } from "./dto/add-bom-item.dto";
import { Prisma } from "@prisma/client";
import { AddDealContactDto } from "./dto/add-deal-contact.dto";


@Injectable()
export class DealsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateDealDto) {
    return this.prisma.deal.create({
      data: {
        title: dto.title,
        clientId: dto.clientId,
        value: dto.value,
        currency: dto.currency ?? "USD",
        tenantId,
        stageHistory: {
          create: { stage: DealStage.LEAD },
        },
      },
    });
  }
  findAll(tenantId: string) {
    return this.prisma.deal.findMany({
      where: { tenantId },
      include: { client: true },
    });
  }
  async findOne(tenantId: string, dealId: string) {
    const deal = await this.prisma.deal.findFirst({
      where: { id: dealId, tenantId },
      include: {
        client: true,
        bomItems: { include: { stockItem: true } },
        stockReservations: true,
      },
    });
    if (!deal) {
      throw new NotFoundException("Deal not found");
    }
    return deal;
  }

  async updateStage(tenantId: string, dealId: string, newStage: DealStage) {
    const deal = await this.findOne(tenantId, dealId);

    return this.prisma.$transaction(async (tx) => {
      await tx.dealStageHistory.updateMany({
        where: { dealId, exitedAt: null },
        data: { ExitedAt: new Date() },
      });

      await tx.dealStageHistory.create({
        data: { dealId, stage: newStage },
      });
      return tx.deal.update({
        where: { id: dealId },
        data: {
          stage: newStage,
          closedAt:
            newStage === DealStage.WON || newStage === DealStage.LOST
              ? new Date()
              : deal.closedAt,
        },
      });
    });
  }

  async addBomItem(tenantId: string, dealId: string, dto: AddBomItemDto) {
    await this.assertDealBelongsToTenant(tenantId, dealId);

    const stockItem = await this.prisma.stockItem.findFirst({
      where: { id: dto.stockItemId, tenantId },
    });
    if (!stockItem) {
      throw new NotFoundException("Stock item not found");
    }

    return this.prisma.dealBomItem.create({
      data: {
        dealId,
        stockItemId: dto.stockItemId,
        quantity: dto.quantity,
        unitCostSnapshot: stockItem.unitCost,
      },
    });
  }

  async removeBomItem(tenantId: string, dealId: string, bomItemId: string) {
    await this.assertDealBelongsToTenant(tenantId, dealId);
    await this.prisma.dealBomItem.deleteMany({
      where: { id: bomItemId, dealId },
    });
  }

  async getCost(tenantId: string, dealId: string) {
    await this.assertDealBelongsToTenant(tenantId, dealId);

    const items = await this.prisma.dealBomItem.findMany({
      where: { dealId },
    });

    const totalCost = items.reduce(
      (sum, item) =>
        sum + Number(item.quantity) * Number(item.unitCostSnapshot),
      0,
    );

    return { dealId, itemsCount: items.length, totalCost };
  }

  async reserveStock(tenantId: string, dealId: string) {
    await this.assertDealBelongsToTenant(tenantId, dealId);

    const bomItems = await this.prisma.dealBomItem.findMany({
      where: { dealId },
    });

    if (bomItems.length === 0) {
      throw new BadRequestException("Deal has no BOM items to reserve");
    }

    return this.prisma.$transaction(async (tx) => {
      for (const item of bomItems) {
        const result: { count: number }[] = await tx.$queryRaw`
                    UPDATE "StockItem"
                    SET "quantityReserved" = "quantityReserved" + ${item.quantity}
                    WHERE id = ${item.stockItemId}
                        AND "tenantId" = ${tenantId}
                        AND "quantityOnHand" - "quantityReserved" >= ${item.quantity}
                    RETURNING 1 as count    
                `;

        if (result.length === 0) {
          throw new BadRequestException(
            `Insufficient stock for item ${item.stockItemId}`,
          );
        }

        await tx.stockReservation.create({
          data: {
            dealId,
            stockItemId: item.stockItemId,
            quantity: item.quantity,
            status: "RESERVED",
          },
        });
      }
      return { dealId, reservedItems: bomItems.length };
    });
  }

  async addContact(tenantId: string, dealId: string, dto: AddDealContactDto) {
    const deal = await this.prisma.deal.findFirst({ where: { id: dealId, tenantId }})
    if (!deal) {
      throw new NotFoundException('Deal not found');
    }

    const contact = await this.prisma.contact.findFirst({
      where: { id: dto.contactId, tenantId },
    });
    if (!contact) {
      throw new NotFoundException('Contact not found');
    }
    if (contact.clientId !== deal.clientId) {
      throw new BadRequestException('Contact does not belong to the deal\'s client')
    }

    return this.prisma.dealContact.create({
      data: {dealId, contactId: dto.contactId, roleInDeal: dto.roleInDeal },
    });
  }

  async removeContact(tenantId: string, dealId: string, contactId: string) {
    await this.assertDealBelongsToTenant(tenantId, dealId)

    try {
      await this.prisma.dealContact.delete({
        where: {dealId_contactId: { dealId, contactId} },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException('This contact is not linked to the deal');
      }
      throw error;
    }
  }

  private async assertDealBelongsToTenant(tenantId: string, dealId: string) {
    const deal = await this.prisma.deal.findFirst({
      where: { id: dealId, tenantId },
    });
    if (!deal) {
      throw new NotFoundException("Deal not found");
    }
  }
}
