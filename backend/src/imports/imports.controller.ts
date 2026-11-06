import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  BadRequestException,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { ImportSourceType } from "@prisma/client";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { CurrentTenant } from "../auth/decorators/current-tenant.decorator";
import { UserRole } from "@prisma/client";
import { ImportsService } from "./imports.service";
import { StockItemColumnMappingDto } from "./dto/column-mapping.dto";

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("imports/stock-items")
export class ImportsController {
  constructor(private readonly importsService: ImportsService) {}
  @Post("preview")
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @UseInterceptors(
    FileInterceptor("file", {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  preview(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException("No file uploaded");
    }
    return this.importsService.previewStockItems(
      file.buffer,
      file.mimetype,
      file.originalname,
    );
  }

  @Post("commit")
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @UseInterceptors(
    FileInterceptor("file", {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async commit(
    @CurrentTenant() tenantId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body("mapping") mappingRaw: string,
  ) {
    if (!file) {
      throw new BadRequestException("No file uploadeed");
    }

    let parsedMapping: unknown;
    try {
      parsedMapping = JSON.parse(mappingRaw);
    } catch {
      throw new BadRequestException("Invalid mapping JSON");
    }

    const mapping = plainToInstance(StockItemColumnMappingDto, parsedMapping);
    const validationErrors = await validate(mapping);
    if (validationErrors.length > 0) {
      throw new BadRequestException("Invalid column mapping");
    }

    return this.importsService.commitStockItems(
      tenantId,
      file.buffer,
      file.mimetype,
      file.originalname,
      mapping,
    );
  }

  @Get("mapping")
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  getSavedMapping(
    @CurrentTenant() tenantId: string,
    @Query("sourceType") sourceType: ImportSourceType,
  ) {
    return this.importsService.getSavedMapping(tenantId, sourceType);
  }
}
