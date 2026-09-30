import { StockMovementType } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateInventoryItemDto {
  @IsString()
  branchId!: string;

  @IsString()
  productId!: string;

  @IsString()
  unitId!: string;

  @IsOptional()
  @IsBoolean()
  allowNegativeStock?: boolean;
}

export class RecordStockMovementDto {
  @IsEnum(StockMovementType)
  type!: StockMovementType;

  @IsString()
  @Matches(/^-?\d+(?:\.\d{1,6})?$/)
  quantityDelta!: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  referenceType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  referenceId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
