import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentTenant } from "../auth/decorators/current-tenant.decorator";
import { DealsService } from "./deals.service";
import { CreateDealDto } from "./dto/create-deal.dto";
import { AddBomItemDto } from "./dto/add-bom-item.dto";
import { UpdateStageDto } from "./dto/update-stage.dto";
import { AddDealContactDto } from "./dto/add-deal-contact.dto";

@UseGuards(JwtAuthGuard)
@Controller('deals')
export class DealsController {
    constructor(private readonly dealsService: DealsService) {}

    @Post()
    create(@CurrentTenant() tenantId: string, @Body() dto: CreateDealDto) {
        return this.dealsService.create(tenantId, dto);
    }

    @Get()
    findAll(@CurrentTenant() tenantId: string) {
        return this.dealsService.findAll(tenantId);
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

    @Post(':id/reserve')
    reserveStock(@CurrentTenant() tenantId: string, @Param('id') id: string) {
        return this.dealsService.reserveStock(tenantId, id);
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
    removeContact(
        @CurrentTenant() tenantId: string,
        @Param('id') id: string,
        @Param('contactId') contactId: string,
    ) {
        return this.dealsService.removeContact(tenantId, id, contactId);
    }
}