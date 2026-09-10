import { IsString, IsNumber, Min, IsOptional, isUUID, IsUUID  } from "class-validator";

export class CreateDealDto {
    @IsString()
    title!: string;

    @IsUUID()
    clientId!: string;

    @IsNumber()
    @Min(0)
    value!: number;

    @IsOptional()
    @IsString()
    currency?: string;
}