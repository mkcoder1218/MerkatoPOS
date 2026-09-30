import { IsBoolean, IsOptional } from 'class-validator';

export class UpdatePosSettingsDto {
  @IsOptional()
  @IsBoolean()
  requireActiveShift?: boolean;

  @IsOptional()
  @IsBoolean()
  tablesEnabled?: boolean;
}
