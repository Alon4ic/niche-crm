import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentTenant } from '../auth/decorators/current-tenant.decorator';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@UseGuards(JwtAuthGuard)
@Controller('clients')
export class ClientsController {
    constructor(private readonly clientsService: ClientsService) {}

    @Post()
    create(@CurrentTenant() tenantId: string, @Body() dto: CreateClientDto) {
        return this.clientsService.create(tenantId, dto);
    }

    @Get()
    findAll(@CurrentTenant() tenantId: string) {
        return this.clientsService.findAll(tenantId);
    }

    @Get(':id')
    findOne(@CurrentTenant() tenantId: string, @Param('id') id: string) {
        return this.clientsService.findOne(tenantId, id);
    }

    @Patch(':id')
    update(
        @CurrentTenant() tenantId: string,
        @Param('id') id: string,
        @Body() dto: UpdateClientDto,
    ) {
        return this.clientsService.update(tenantId, id, dto);
    }

    @Delete(':id')
    remove(@CurrentTenant() tenantId: string, @Param('id') id: string) {
        return this.clientsService.remove(tenantId, id);
    }
}