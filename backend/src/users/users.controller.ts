import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { UsersService } from "./users.service";
import { Roles } from "../auth/decorators/roles.decorator";
import { UserRole } from "@prisma/client";
import { CurrentTenant } from "../auth/decorators/current-tenant.decorator";
import { CreateUserDto } from "./dto/create-user.dto";

@UseGuards(JwtAuthGuard, RolesGuard) 
@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @Post()
    @Roles(UserRole.OWNER)
    create(@CurrentTenant() tenantId: string, @Body() dto: CreateUserDto) {
        return this.usersService.create(tenantId, dto);
    }

    @Get()
    @Roles(UserRole.OWNER, UserRole.ADMIN)
    findAll(@CurrentTenant() tenantId: string) {
        return this.usersService.findAll(tenantId);
    }
}

