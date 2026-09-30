import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @IsString()
  @Matches(/^[a-z0-9-]+$/)
  tenantSlug!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(60)
  @Matches(/^[a-zA-Z0-9._-]+$/)
  username!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}
