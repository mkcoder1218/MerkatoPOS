import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcrypt';
import { AuthRepository } from './auth.repository';
import type { JwtPayload } from './auth.types';
import type { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly repository: AuthRepository,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto): Promise<{ accessToken: string }> {
    const user = await this.repository.findLoginUser(dto.tenantSlug, dto.email.toLowerCase());

    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const permissions = Array.from(
      new Set(
        user.roles.flatMap(({ role }) =>
          role.permissions.map(({ permission }) => permission.code),
        ),
      ),
    );

    const payload: JwtPayload = {
      sub: user.id,
      userId: user.id,
      tenantId: user.tenantId,
      email: user.email,
      branchIds: user.branches.map(({ branchId }) => branchId),
      permissions,
    };

    return { accessToken: await this.jwtService.signAsync(payload) };
  }
}
