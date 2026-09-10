import { IsString, IsOptional } from "class-validator";

export class CreateClientDto {
    @IsString()
    name!: string;

    @IsOptional()
    @IsString()
    industry?: string;

    @IsOptional()
    @IsString()
    notes?: string;

}