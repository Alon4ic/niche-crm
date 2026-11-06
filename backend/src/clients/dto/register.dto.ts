import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { Trim, TrimToUndefined } from '../../common/transforms/trim.transforms';

export class RegisterDto {
    @IsEmail()
    email!: string;

    @IsString()
    @MinLength(8)
    password!: string;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    @TrimToUndefined()
    firstName?: string;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    @TrimToUndefined()
    lastName?: string;

    @Trim()
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    tenantName!: string;
}