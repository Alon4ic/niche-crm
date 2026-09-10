import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateStockItemDto } from './dto/create-stock-item.dto';
import { UpdateStockItemDto } from "./dto/upddate-stock-item.dto";

@Injectable()
export class StockItemsService {
    constructor(private readonly prisma: PrismaService) {}

    create(tenantId: string, dto: CreateStockItemDto) {
        return this.prisma.stockItem.create({
            data: {
                ...dto,
                quantityOnHand: dto.quantityOnHand ?? 0,
                tenantId,
            },
        });
    }

    findAll(tenantId: string) {
        return this.prisma.stockItem.findMany({ where: { tenantId } })
    }

    async findOne(tenantId: string, id: string) {
        const item = await this.prisma.stockItem.findFirst({ where: { id, tenantId } })
        if (!item) {
            throw new NotFoundException('Stock item not found');
        }
        return item;
    }

    async update(tenantId: string, id: string, dto: UpdateStockItemDto) {
        await this.findOne(tenantId, id);
        return this.prisma.stockItem.update({ where: { id }, data: dto });
    }

    async remove(tenantId: string, id: string) {
        await this.findOne(tenantId, id);
        await this.prisma.stockItem.delete({ where: { id } });
    }
}