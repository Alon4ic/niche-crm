import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateStockItemDto } from './dto/create-stock-item.dto';
import { UpdateStockItemDto } from "./dto/upddate-stock-item.dto";
import { Prisma, StockItem } from "@prisma/client";

@Injectable()
export class StockItemsService {
    constructor(private readonly prisma: PrismaService) {}

    private withAvailable(item: StockItem) {
        return {
            ...item,
            quantityAvailable: item.quantityOnHand.minus(item.quantityReserved),
        };
    }

    async create(tenantId: string, dto: CreateStockItemDto) {
        const item = await this.prisma.stockItem.create({
            data: {
                ...dto,
                quantityOnHand: dto.quantityOnHand ?? 0,
                tenantId,
            },
        });
        return this.withAvailable(item);
    }

    async findAll(tenantId: string) {
        const items = await this.prisma.stockItem.findMany({ where: {tenantId } });
        return items.map((item) => this.withAvailable(item));
    }

    async findOne(tenantId: string, id: string) {
        const item = await this.prisma.stockItem.findFirst({ where: { id, tenantId } })
        if (!item) {
            throw new NotFoundException('Stock item not found');
        }
        return this.withAvailable(item);
    }

    async update(tenantId: string, id: string, dto: UpdateStockItemDto) {
        return this.prisma.$transaction(async (tx) => {
            const rows = await tx.$queryRaw<{ quantityReserved: Prisma.Decimal }[]>`
                SELECT "quantityReserved" FROM "StockItem"
                WHERE id = ${id} AND "tenantId" = ${tenantId}
                FOR UPDATE
            `;
            if (rows.length === 0) {
                throw new NotFoundException('Stock item not found');
            }

            if (
                dto.quantityOnHand !== undefined &&
                new Prisma.Decimal(dto.quantityOnHand).lessThan(new Prisma.Decimal(rows[0].quantityReserved))
            ) {
                throw new ConflictException({
                    code: 'STOCK_BELOW_RESERVED',
                    message: "Quantity on hand cannot be lower than the reserved quantity",
                });
            }
            const item = await tx.stockItem.update({ where: { id }, data: dto })
            return this.withAvailable(item);
        });
    }

    async remove(tenantId: string, id: string) {
        await this.findOne(tenantId, id);
        try {
            await this.prisma.stockItem.delete({ where: { id } });
        } catch (e) {
            if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2003') {
                throw new ConflictException({
                    code: 'STOCK_ITEM_IN_USE',
                    message: 'Stock item is used in a deal and cannot be deleted',
                });
            }
            throw e;
        }
        
    }
}