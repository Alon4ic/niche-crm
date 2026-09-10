import { IsUUID, IsNumber, Min } from "class-validator";

export class AddBomItemDto {
    @IsUUID()
    stockItemId!: string;

    @IsNumber()
    @Min(0.001)
    quantity!: number;
}