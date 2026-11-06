import { IsEmail, IsString, MinLength, IsOptional, IsNotEmpty } from 'class-validator';
import { Trim, TrimToUndefined, NormalizeEmail } from '../../common/transforms/trim.transforms';

export class RegisterDto {
    @NormalizeEmail()
    @IsEmail()
    email!: string;

    @IsString()
    @MinLength(8)
    password!: string;

    @TrimToUndefined()
    @IsOptional()
    @IsString()
    firstName?: string;

    @TrimToUndefined()
    @IsOptional()
    @IsString()
    lastName?: string;

    @Trim()
    @IsString()
    @IsNotEmpty()
    tenantName!: string;
}