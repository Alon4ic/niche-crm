import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from "class-validator";
import { ReturnDisposition } from "@prisma/client";

export class ReturnItemDto {
    @IsUUID()
    stockItemId!: string;

    @IsNumber({ maxDecimalPlaces: 3 })
    @Min(0.001)
    quantity!: number;

    @IsEnum(ReturnDisposition)
    disposition!: ReturnDisposition;
}

export class CreateReturnDto {
    @IsOptional()
    @IsString()
    @MaxLength(500)
    reason?: string;

    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => ReturnItemDto)
    items!: ReturnItemDto[];
}
