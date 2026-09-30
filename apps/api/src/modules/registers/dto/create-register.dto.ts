import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateRegisterDto {
  @IsString()
  branchId!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(30)
  code!: string;

  @IsOptional()
  @IsString()
  deviceId?: string;
}
