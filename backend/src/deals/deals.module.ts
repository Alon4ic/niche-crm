import { Module } from "@nestjs/common";
import { DealsService } from "./deals.service";
import { DealsController } from "./deals.controller";
import { QuotePdfService } from "./services/quote-pdf.service";
import { ReturnsService } from "./returns.service";
import { ReturnsController } from "./returns.controller";

@Module({
  providers: [DealsService, QuotePdfService, ReturnsService],
  controllers: [DealsController, ReturnsController],
})
export class DealsModule {}
