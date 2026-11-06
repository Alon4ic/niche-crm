import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { UpdateSettingsDto } from "./dto/update-settings.dto";

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  get(tenantId: string) {
    return this.prisma.tenant.findUniqueOrThrow({
      where: { id: tenantId },
      select: { returnWindowDays: true },
    });
  }
  update(tenantId: string, dto: UpdateSettingsDto) {
    return this.prisma.tenant.update({
        where: { id: tenantId },
        data: dto,
        select: { returnWindowDays: true },
    });
  }
}
