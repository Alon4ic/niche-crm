import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentTenant } from "../auth/decorators/current-tenant.decorator";
import { StockItemsService } from "./stock-items.service";
import { CreateStockItemDto } from "./dto/create-stock-item.dto";
import { UpdateStockItemDto } from "./dto/upddate-stock-item.dto";

@UseGuards(JwtAuthGuard)
@Controller('stock-items')
export class StockItemsController {
    constructor(private readonly stockItemsService: StockItemsService) {}

    @Post()
    create(@CurrentTenant() tenantId: string, @Body() dto: CreateStockItemDto) {
        return this.stockItemsService.create(tenantId, dto);
    }

    @Get()
    findAll(@CurrentTenant() tenantId: string) {
        return this.stockItemsService.findAll(tenantId);
    }

    @Get(':id')
    findOne(@CurrentTenant() tenantId: string, @Param('id') id: string) {
        return this.stockItemsService.findOne(tenantId, id);
    }

    @Patch(':id')
    update(
        @CurrentTenant() tenantId: string,
        @Param('id') id: string,
        @Body() dto: UpdateStockItemDto,
    ) {
        return this.stockItemsService.update(tenantId, id, dto);
    }

    @Delete(':id')
    remove(@CurrentTenant() tenantId: string, @Param('id') id: string) {
        return this.stockItemsService.remove(tenantId, id);
    }
}