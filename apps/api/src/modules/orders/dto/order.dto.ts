import { OrderType, PaymentMethod } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class OrderLineInputDto {
  @IsString()
  productId!: string;

  @IsString()
  @Matches(/^\d+(?:\.\d{1,6})?$/)
  quantity!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  modifierOptionIds?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

export class CreateOrderDto {
  @IsString()
  branchId!: string;

  @IsString()
  registerId!: string;

  @IsEnum(OrderType)
  type!: OrderType;

  @IsOptional()
  @IsString()
  tableId?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderLineInputDto)
  items!: OrderLineInputDto[];
}

export class UpdateOrderDto {
  @IsOptional()
  @IsEnum(OrderType)
  type?: OrderType;

  @IsOptional()
  @IsString()
  tableId?: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderLineInputDto)
  items?: OrderLineInputDto[];
}

export class PaymentInputDto {
  @IsEnum(PaymentMethod)
  method!: PaymentMethod;

  @IsString()
  @Matches(/^\d+(?:\.\d{1,2})?$/)
  amount!: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  reference?: string;
}

export class CompleteSaleDto {
  @IsString()
  @MinLength(1)
  @MaxLength(150)
  idempotencyKey!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PaymentInputDto)
  payments!: PaymentInputDto[];
}

export class RequestVoidDto {
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  reason!: string;
}

export class DecideVoidDto {
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  note!: string;
}
