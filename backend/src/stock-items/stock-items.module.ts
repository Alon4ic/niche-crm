import { Module } from "@nestjs/common";
import { StockItemsService } from "./stock-items.service";
import { StockItemsController } from './stock-items.controller';

@Module({
    providers: [StockItemsService],
    controllers: [StockItemsController],
    exports: [StockItemsService],
})
export class StockItemsModule {}