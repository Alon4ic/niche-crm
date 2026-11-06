import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { ReturnsService } from "./returns.service";
import { CurrentTenant } from "../auth/decorators/current-tenant.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { UserRole } from "@prisma/client";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { JwtPayload } from "../auth/types/jwt-payload.interface";
import { CreateReturnDto } from "./dto/create-return.dto";


@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('deals/:dealId/returns')
export class ReturnsController {
    constructor(private readonly returnsService: ReturnsService) {}

    @Get()
    list(@CurrentTenant() tenantId: string, @Param('dealId') dealId: string) {
        return this.returnsService.list(tenantId, dealId)
    }

    @Post()
    @Roles(UserRole.OWNER, UserRole.ADMIN)
    create(
        @CurrentTenant() tenantId: string,
        @CurrentUser() user: JwtPayload,
        @Param('dealId') dealId: string,
        @Body() dto: CreateReturnDto,
    ) {
        return this.returnsService.create(tenantId, user.sub, dealId, dto);
    }
}