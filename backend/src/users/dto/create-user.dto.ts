import { IsEmail, IsString, MinLength, IsEnum, IsOptional, MaxLength } from "class-validator";
import { UserRole } from "@prisma/client";
import { TrimToUndefined, NormalizeEmail } from "../../common/transforms/trim.transforms";

export class CreateUserDto {
    @NormalizeEmail()
    @IsEmail()
    email!: string;

    @IsString()
    @MinLength(8)
    password!: string;

    @IsEnum(UserRole)
    role!: UserRole;

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
}