import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateModifierGroupDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  minSelect?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  maxSelect?: number;
}

export class UpdateModifierGroupDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  minSelect?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  maxSelect?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateModifierOptionDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  @IsString()
  @Matches(/^-?\d+(?:\.\d{1,2})?$/)
  priceDelta!: string;
}

export class UpdateModifierOptionDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @Matches(/^-?\d+(?:\.\d{1,2})?$/)
  priceDelta?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class AttachModifierGroupsDto {
  @IsArray()
  @IsString({ each: true })
  modifierGroupIds!: string[];
}
