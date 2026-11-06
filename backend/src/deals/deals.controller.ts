import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentTenant } from "../auth/decorators/current-tenant.decorator";
import { DealsService } from "./deals.service";
import { CreateDealDto } from "./dto/create-deal.dto";
import { AddBomItemDto } from "./dto/add-bom-item.dto";
import { UpdateStageDto } from "./dto/update-stage.dto";
import { AddDealContactDto } from "./dto/add-deal-contact.dto";
import { Res } from "@nestjs/common";
import type { Response } from "express";
import { QuotePdfService } from "./services/quote-pdf.service";

@UseGuards(JwtAuthGuard)
@Controller('deals')
export class DealsController {
    constructor(
        private readonly dealsService: DealsService,
        private readonly quotePdfService: QuotePdfService,
    ) {}

    @Post()
    create(@CurrentTenant() tenantId: string, @Body() dto: CreateDealDto) {
        return this.dealsService.create(tenantId, dto);
    }

    @Get()
    findAll(@CurrentTenant() tenantId: string) {
        return this.dealsService.findAll(tenantId);
    }

    @Get('analytics/funnel')
    getFunnelAnalitics(@CurrentTenant() tenantId: string) {
        return this.dealsService.getFunnelAnalytics(tenantId);
    }

    @Get(':id')
    findOne(@CurrentTenant() tenantId: string, @Param('id') id: string) {
        return this.dealsService.findOne(tenantId, id);
    }

    @Patch(':id/stage')
    updateStage(
        @CurrentTenant() tenantId: string,
        @Param('id') id: string,
        @Body() dto: UpdateStageDto
    ) {
        return this.dealsService.updateStage(tenantId, id, dto.stage);
    }

    @Post(':id/bom-items')
    addBomItem(
        @CurrentTenant() tenantId: string,
        @Param('id') id: string,
        @Body() dto: AddBomItemDto,
    ) {
        return this.dealsService.addBomItem(tenantId, id, dto)
    }

    @Delete(':id/bom-items/:itemId')
    @HttpCode(204)
    removeBomItem(
        @CurrentTenant() tenantId: string,
        @Param('id') id: string,
        @Param('itemId') itemId: string,
    ) {
        return this.dealsService.removeBomItem(tenantId, id, itemId);
    }

    @Get(':id/cost')
    getCost(@CurrentTenant() tenantId: string, @Param('id') id: string){
        return this.dealsService.getCost(tenantId, id);
    }

    @Get(':id/quote')
    async getQuotePdf(
        @CurrentTenant() tenantId: string,
        @Param('id') id: string,
        @Res() res: Response,
    ) {
        const deal = await this.dealsService.findOne(tenantId, id);
        const cost = await this.dealsService.getCost(tenantId, id);

        this.quotePdfService.generate(
            {
                dealTitle: deal.title,
                clientName: deal.client.name,
                currency: deal.currency,
                createdAt: deal.createdAt,
                bomItems: deal.bomItems.map((item) => ({
                    name: item.stockItem.name,
                    sku: item.stockItem.sku,
                    quantity: item.quantity.toString(),
                    unitCostSnapshot: item.unitCostSnapshot.toString(),
                })),
                totalCost: cost.totalCost,
            },
            res,
        );
    }

    @Post(':id/reserve')
    reserveStock(@CurrentTenant() tenantId: string, @Param('id') id: string) {
        return this.dealsService.reserveStock(tenantId, id);
    }

    @Post(':id/release')
    releaseReservation(@CurrentTenant() tenantId: string, @Param('id') id: string) {
        return this.dealsService.releaseReservation(tenantId, id);
    }

    @Post(':id/contacts')
    addContact(
        @CurrentTenant() tenantId: string,
        @Param('id') id: string,
        @Body() dto: AddDealContactDto,
    ) {
        return this.dealsService.addContact(tenantId, id, dto);
    }

    @Delete(':id/contacts/:contactId')
    @HttpCode(204)
    removeContact(
        @CurrentTenant() tenantId: string,
        @Param('id') id: string,
        @Param('contactId') contactId: string,
    ) {
        return this.dealsService.removeContact(tenantId, id, contactId);
    }
}