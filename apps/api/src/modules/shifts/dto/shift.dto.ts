import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class OpenShiftDto {
  @IsString()
  branchId!: string;

  @IsString()
  registerId!: string;

  @IsString()
  @Matches(/^\d+(?:\.\d{1,2})?$/)
  openingCash!: string;
}

export class CloseShiftDto {
  @IsString()
  @Matches(/^\d+(?:\.\d{1,2})?$/)
  countedCash!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
