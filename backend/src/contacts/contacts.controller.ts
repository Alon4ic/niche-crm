import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentTenant } from "../auth/decorators/current-tenant.decorator";
import { ContactsService } from "./contacts.service";
import { CreateContactDto } from "./dto/create-contact.dto";
import { UpdateContactDto } from "./dto/update-contact.dto";

@UseGuards(JwtAuthGuard)
@Controller('contacts')
export class ContactsController {
    constructor(private readonly contactsService: ContactsService) {}

    @Post()
    create(@CurrentTenant() tenantId: string, @Body() dto: CreateContactDto) {
        return this.contactsService.create(tenantId, dto);
    }

    @Get()
    findAll(@CurrentTenant() tenantId: string, @Query('clientId') clientId?: string) {
        return this.contactsService.findAll(tenantId, clientId);
    }

    @Get(':id')
    findOne(@CurrentTenant() tenantId: string, @Param('id') id: string) {
        return this.contactsService.findOne(tenantId, id);
    }

    @Patch(':id')
    update(
        @CurrentTenant() tenantId: string,
        @Param('id') id: string,
        @Body() dto: UpdateContactDto,
    ) {
        return this.contactsService.update(tenantId, id, dto);
    }

    @Delete(':id')
    remove(@CurrentTenant() tenantId: string, @Param('id') id: string) {
        return this.contactsService.remove(tenantId, id);
    }
}