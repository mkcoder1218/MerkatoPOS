import { TaxMode } from '@prisma/client';
import { IsBoolean, IsEnum, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class CreateTaxProfileDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  @IsString()
  @Matches(/^\d+(?:\.\d{1,2})?$/)
  percentage!: string;

  @IsEnum(TaxMode)
  mode!: TaxMode;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class UpdateTaxProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d+(?:\.\d{1,2})?$/)
  percentage?: string;

  @IsOptional()
  @IsEnum(TaxMode)
  mode?: TaxMode;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
