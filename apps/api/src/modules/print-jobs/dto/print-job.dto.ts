import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ClaimPrintJobDto {
  @IsString()
  printerId!: string;
}

export class FailPrintJobDto {
  @IsString()
  @MaxLength(1000)
  error!: string;
}

export class ReprintJobDto {
  @IsOptional()
  @IsString()
  printerId?: string;
}
