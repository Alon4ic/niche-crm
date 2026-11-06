import { IsInt, IsOptional, Max, Min } from "class-validator";
export class UpdateSettingsDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(365)
  returnWindowDays?: number;
}
