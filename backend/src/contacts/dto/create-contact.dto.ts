import { IsString, IsOptional, IsEmail, IsUUID } from 'class-validator';

export class CreateContactDto {
    @IsString()
    fullName!: string;

    @IsOptional()
    @IsString()
    roleTitle?: string;

    @IsOptional()
    @IsEmail()
    email?: string;

    @IsOptional()
    @IsString()
    phone?: string;

    @IsUUID()
    clientId!: string;
}