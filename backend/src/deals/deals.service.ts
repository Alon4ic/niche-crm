import { BadRequestException, NotFoundException } from "@nestjs/common";
import { Injectable } from "@nestjs/common";
import { DealStage } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateDealDto } from "./dto/create-deal.dto";
import { AddBomItemDto } from "./dto/add-bom-item.dto";
import { Prisma } from "@prisma/client";
import { AddDealContactDto } from "./dto/add-deal-contact.dto";
import { ConflictException } from "@nestjs/common";

@Injectable()
export class DealsService {
  private readonly ALL_STAGES: DealStage[] = [
    DealStage.LEAD,
    DealStage.QUALIFIED,
    DealStage.PROPOSAL,
    DealStage.NEGOTIATION,
    DealStage.WON,
    DealStage.LOST,
  ];

  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateDealDto) {
    const client = await this.prisma.client.findFirst({
      where: { id: dto.clientId, tenantId },
      select: { id : true },
    });
    if (!client) {
      throw new NotFoundException('Client not found');
    }
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
        dealContacts: { include: { contact: true } },
      },
    });
    if (!deal) {
      throw new NotFoundException("Deal not found");
    }
    return deal;
  }

  async updateStage(tenantId: string, dealId: string, newStage: DealStage) {
    await this.assertDealBelongsToTenant(tenantId, dealId);

    return this.prisma.$transaction(async (tx) => {
      await this.lockDeal(tx, dealId);
      const deal = await tx.deal.findUniqueOrThrow({ where: { id: dealId } });

      if (deal.stage === newStage) {
        return deal;
      }

      if (deal.stage === DealStage.WON) {
        const fulfilled = await tx.stockReservation.count({ where: {dealId, status: 'FULFILLED' } });
        if (fulfilled > 0) {
          throw new ConflictException({
            code: 'WON_IS_FINAL',
            message: 'A Won deal cannot be reopened: its stock has been deducted',
          });
        }
      }

      if (newStage === DealStage.WON) {
        const hasBom = (await tx.dealBomItem.count({ where: { dealId } })) > 0;
        if(hasBom) {
          const reserved = await tx.stockReservation.count({ where: { dealId, status: 'RESERVED' } })
          if (reserved === 0) {
            throw new ConflictException({
              code: 'STAGE_NEEDS_RESERVATION',
              message: "Reserve the stock before marking the deal as Won",
            });
          }
          await this.fulfillActiveReservations(tx, tenantId, dealId);
        }
      }
      if (newStage === DealStage.LOST) {
        await this.releaseActiveReservations(tx, tenantId, dealId);
      }
      
      await tx.dealStageHistory.updateMany({
        where: { dealId, exitedAt: null },
        data: {exitedAt: new Date() },
      });
      await tx.dealStageHistory.create({ data: { dealId, stage: newStage } });
      return tx.deal.update({
        where: { id: dealId },
        data: {
          stage: newStage,
          closedAt:
            newStage === DealStage.WON || newStage === DealStage.LOST ? new Date() : deal.closedAt,
        },
      });
    });
  }

  async getFunnelAnalytics(tenantId: string) {
    const stageCounts = await this.prisma.deal.groupBy({
      by: ["stage"],
      where: { tenantId },
      _count: { _all: true },
      _sum: { value: true },
    });

    const avgDaysRaw: { stage: DealStage; avgDays: number | null }[] =
      await this.prisma.$queryRaw`
  SELECT dsh.stage, AVG(EXTRACT(EPOCH FROM (dsh."exitedAt" - dsh."enteredAt")) / 86400.0) as "avgDays"
  FROM "DealStageHistory" dsh
  JOIN "Deal" d ON d.id = dsh."dealId"
  WHERE dsh."exitedAt" IS NOT NULL AND d."tenantId" = ${tenantId}
  GROUP BY dsh.stage
`;
    const stages = this.ALL_STAGES.map((stage) => {
      const countRow = stageCounts.find((s) => s.stage === stage);
      const avgRow = avgDaysRaw.find((a) => a.stage === stage);
      return {
        stage,
        count: countRow?._count._all ?? 0,
        totalValue: Number(countRow?._sum.value ?? 0),
        avgDaysInStage: avgRow?.avgDays != null ? Number(avgRow.avgDays) : null,
      };
    });
    const totalDeals = stages.reduce((sum, s) => sum + s.count, 0);
    const wonCount = stages.find((s) => s.stage === "WON")?.count ?? 0;
    const lostCount = stages.find((s) => s.stage === "LOST")?.count ?? 0;
    const closedCount = wonCount + lostCount;
    const winRatePercent =
      closedCount > 0 ? (wonCount / closedCount) * 100 : null;

    return { stages, totalDeals, wonCount, lostCount, winRatePercent };
  }

  async addBomItem(tenantId: string, dealId: string, dto: AddBomItemDto) {
    await this.assertDealBelongsToTenant(tenantId, dealId);


    const stockItem = await this.prisma.stockItem.findFirst({
      where: { id: dto.stockItemId, tenantId },
    });
    if (!stockItem) {
      throw new NotFoundException("Stock item not found");
    }

    return this.prisma.$transaction(async (tx) => {
      await this.lockDeal(tx, dealId);
      await this.assertBomEditable(tx, dealId);
      return tx.dealBomItem.create({
        data: {
          dealId,
          stockItemId: dto.stockItemId,
          quantity: dto.quantity,
          unitCostSnapshot: stockItem.unitCost,
        },
      });
    });
  }

  async removeBomItem(tenantId: string, dealId: string, bomItemId: string) {
    await this.assertDealBelongsToTenant(tenantId, dealId);
    
    await this.prisma.$transaction(async (tx) => {
      await this.lockDeal(tx, dealId);
      await this.assertBomEditable(tx, dealId);
      await tx.dealBomItem.deleteMany({ where: { id: bomItemId, dealId } });
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

    return this.prisma.$transaction(async (tx) => {
      await this.lockDeal(tx, dealId);
      
      const deal = await tx.deal.findUniqueOrThrow({
        where: {id: dealId }
      });
      if (deal.stage === DealStage.WON || deal.stage === DealStage.LOST) {
        throw new ConflictException({ code: 'DEAL_CLOSED', message: 'Reopen the deal before reserving stock' });
      }


      const alreadyReserved = await tx.stockReservation.count({
        where: { dealId, status: 'RESERVED' },
      });
      if (alreadyReserved > 0) {
        throw new ConflictException({ code: 'ALREADY_RESERVED', message: 'Stock is already reserved for this deal' });
      }

      const bomItems = await this.prisma.dealBomItem.findMany({
        where: { dealId },
      });

      if (bomItems.length === 0) {
        throw new BadRequestException("Deal has no BOM items to reserve");
      }

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
          throw new BadRequestException(`Insufficient stock for item ${item.stockItemId}`);
        }
        await tx.stockReservation.create({
          data: {dealId, stockItemId: item.stockItemId, quantity: item.quantity, status: 'RESERVED' },
        });
      }
      return { dealId, reservedItems: bomItems.length };
    });
  }

  async releaseReservation(tenantId: string, dealId: string) {
    await this.assertDealBelongsToTenant(tenantId,  dealId);

      return this.prisma.$transaction(async (tx) => {
        await this.lockDeal(tx, dealId);
        const released = await this.releaseActiveReservations(tx, tenantId, dealId);
        if (released === 0) {
          throw new BadRequestException('No active reservations for this deal');
        }
        return { dealId, releasedItems: released};
    });
  }

  async addContact(tenantId: string, dealId: string, dto: AddDealContactDto) {
    const deal = await this.prisma.deal.findFirst({
      where: { id: dealId, tenantId },
    });
    if (!deal) {
      throw new NotFoundException("Deal not found");
    }

    const contact = await this.prisma.contact.findFirst({
      where: { id: dto.contactId, tenantId },
    });
    if (!contact) {
      throw new NotFoundException("Contact not found");
    }
    if (contact.clientId !== deal.clientId) {
      throw new BadRequestException(
        "Contact does not belong to the deal's client",
      );
    }

    return this.prisma.dealContact.create({
      data: { dealId, contactId: dto.contactId, roleInDeal: dto.roleInDeal },
    });
  }

  async removeContact(tenantId: string, dealId: string, contactId: string) {
    await this.assertDealBelongsToTenant(tenantId, dealId);

    try {
      await this.prisma.dealContact.delete({
        where: { dealId_contactId: { dealId, contactId } },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        throw new NotFoundException("This contact is not linked to the deal");
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
  private async lockDeal(tx: Prisma.TransactionClient, dealId: string) {
    await tx.$queryRaw`SELECT id FROM "Deal" WHERE id = ${dealId} FOR UPDATE`;
  }

  private async assertNoActiveReservation(tx: Prisma.TransactionClient, dealId: string) {
    const active = await tx.stockReservation.count({
      where: { dealId, status: 'RESERVED' },
    });
    if (active > 0) {
      throw new ConflictException('Release the stock reservation before changing the BOM');
    }
  }

  private async assertBomEditable(tx: Prisma.TransactionClient, dealId: string) {
    const deal = await tx.deal.findUniqueOrThrow({ where: { id: dealId }, select: { stage: true } });
    if (deal.stage === DealStage.WON) {
      throw new ConflictException({ code: 'BOM_LOCKED_WON', message: 'The BOM of a Won deal cannot be changed' });
    }
    const active = await tx.stockReservation.count({ where: { dealId, status: 'RESERVED'} });
    if (active > 0) {
      throw new ConflictException({ code: 'BOM_LOCKED_RESERVED', message: 'Release the stock reservation before changing the BOM' });
    }
  }

  private async releaseActiveReservations(tx: Prisma.TransactionClient, tenantId: string, dealId: string) {
    const active = await tx.stockReservation.findMany({
      where: { dealId, status: 'RESERVED' },
      orderBy: { stockItemId: 'asc' },
    });
    for (const r of active) {
      await tx.$executeRaw`
        UPDATE "StockItem"
        SET "quantityReserved" = "quantityReserved" - ${r.quantity}
        WHERE id = ${r.stockItemId} AND "tenantId" = ${tenantId}
      `;
    }
    if (active.length > 0) {
      await tx.stockReservation.updateMany({
        where: { dealId, status: 'RESERVED' },
        data: { status: 'RELEASED'},
      });
    }
    return active.length;
  }

  private async fulfillActiveReservations(tx: Prisma.TransactionClient, tenantId: string, dealId: string) {
    const active = await tx.stockReservation.findMany({
      where: { dealId, status: 'RESERVED'},
      orderBy: {stockItemId: 'asc'},
    });
    for (const r of active) {
      const updated: { count: number }[] = await tx.$queryRaw`
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
        throw new ConflictException({
          code: 'STOCK_CHANGED',
          message: 'Stock changed after the reservation and cannot be deducted',
        });
      }
    }
    await tx.stockReservation.updateMany({
      where: {dealId, status: 'RESERVED' },
      data: {status: 'FULFILLED' },
    });
    return active.length;
  }
}
