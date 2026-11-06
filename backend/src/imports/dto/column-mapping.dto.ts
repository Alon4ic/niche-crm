import { IsString, IsOptional } from 'class-validator';
export class StockItemColumnMappingDto {
    @IsString()
    sku!: string;

    @IsString()
    name!: string;

    @IsString()
    unit!: string;

    @IsString()
    unitCost!: string;

    @IsOptional()
    @IsString()
    quantityOnHand?: string;
}