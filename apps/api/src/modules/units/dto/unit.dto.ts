import { IsBoolean, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class CreateUnitDto {
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(20)
  symbol!: string;
}

export class UpdateUnitDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(20)
  symbol?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateUnitConversionDto {
  @IsString()
  fromUnitId!: string;

  @IsString()
  toUnitId!: string;

  @IsString()
  @Matches(/^\d+(?:\.\d{1,6})?$/)
  multiplier!: string;
}
