import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentTenant } from '../auth/decorators/current-tenant.decorator';
import { SettingsService } from './settings.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('settings')
export class SettingsController {
    constructor(private readonly settingsService: SettingsService) {}

    @Get()
    get(@CurrentTenant() tenantId: string) {
        return this.settingsService.get(tenantId);
    }

    @Patch()
    @Roles(UserRole.OWNER)
    update(@CurrentTenant() tenantId: string, @Body() dto: UpdateSettingsDto) {
        return this.settingsService.update(tenantId, dto);
    }
}