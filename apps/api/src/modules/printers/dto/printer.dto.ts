import { PrinterInterface, PrinterType, type Prisma } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreatePrinterDto {
  @IsString()
  branchId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  @IsEnum(PrinterType)
  type!: PrinterType;

  @IsEnum(PrinterInterface)
  interface!: PrinterInterface;

  @IsOptional()
  @IsObject()
  connectionData?: Prisma.InputJsonObject;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class UpdatePrinterDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsEnum(PrinterInterface)
  interface?: PrinterInterface;

  @IsOptional()
  @IsObject()
  connectionData?: Prisma.InputJsonObject;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class AssignReceiptPrinterDto {
  @IsString()
  registerId!: string;

  @IsString()
  printerId!: string;
}

export class CreateKitchenRouteDto {
  @IsString()
  branchId!: string;

  @IsString()
  printerId!: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  productId?: string;
}

export class UpdateKitchenRouteDto {
  @IsOptional()
  @IsString()
  printerId?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
