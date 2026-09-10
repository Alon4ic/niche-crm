import { IsString, IsNumber, Min, IsOptional } from 'class-validator';

export class CreateStockItemDto {
    @IsString()
    sku!: string;

    @IsString()
    name!: string;

    @IsString()
    unit!: string;

    @IsNumber()
    @Min(0)
    unitCost!: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    quantityOnHand?: number;
}