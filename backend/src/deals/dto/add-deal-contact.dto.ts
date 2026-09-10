import { IsUUID, IsOptional, IsString } from "class-validator";

export class AddDealContactDto {
    @IsUUID()
    contactId!: string;

    @IsOptional()
    @IsString()
    roleInDeal?: string;
}