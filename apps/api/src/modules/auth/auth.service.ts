import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'node:crypto';
import { AuthRepository } from './auth.repository';
import type { JwtPayload } from './auth.types';
import type { ChangePasswordDto } from './dto/change-password.dto';
import type { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly repository: AuthRepository,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(
    dto: LoginDto,
    metadata: { userAgent?: string; ipAddress?: string },
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const user = await this.repository.findLoginUser(dto.tenantSlug, dto.username.toLowerCase());

    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const refreshToken = this.createRefreshToken();
    const session = await this.repository.createSession({
      userId: user.id,
      refreshTokenHash: this.hashRefreshToken(refreshToken),
      expiresAt: this.getRefreshExpiry(),
      ...(metadata.userAgent ? { userAgent: metadata.userAgent } : {}),
      ...(metadata.ipAddress ? { ipAddress: metadata.ipAddress } : {}),
    });

    return {
      accessToken: await this.createAccessToken(user.id, session.id),
      refreshToken,
    };
  }

  async refresh(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const session = await this.repository.findSessionByRefreshTokenHash(
      this.hashRefreshToken(refreshToken),
    );

    if (
      !session ||
      session.revokedAt ||
      session.expiresAt <= new Date() ||
      !session.user.isActive
    ) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const nextRefreshToken = this.createRefreshToken();
    await this.repository.rotateSession(
      session.id,
      this.hashRefreshToken(nextRefreshToken),
      this.getRefreshExpiry(),
    );

    return {
      accessToken: await this.createAccessToken(session.userId, session.id),
      refreshToken: nextRefreshToken,
    };
  }

  async logout(sessionId: string): Promise<{ success: true }> {
    await this.repository.revokeSession(sessionId);
    return { success: true };
  }

  async getCurrentUser(user: JwtPayload) {
    const current = await this.repository.findUserForAuth(user.userId);
    if (!current) {
      throw new UnauthorizedException('User is no longer active');
    }

    return {
      id: current.id,
      tenantId: current.tenantId,
      name: current.name,
      username: current.username,
      email: current.email,
      branchIds: current.branches.map(({ branchId }) => branchId),
      permissions: this.extractPermissions(current.roles),
    };
  }

  async changePassword(
    user: JwtPayload,
    dto: ChangePasswordDto,
  ): Promise<{ success: true }> {
    const current = await this.repository.findUserForAuth(user.userId);
    if (!current || !(await bcrypt.compare(dto.currentPassword, current.passwordHash))) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    await this.repository.updatePassword(user.userId, await bcrypt.hash(dto.newPassword, 12));
    await this.repository.revokeAllUserSessions(user.userId);
    return { success: true };
  }

  async hydrateAuthenticatedUser(userId: string, sessionId: string): Promise<JwtPayload> {
    const [session, user] = await Promise.all([
      this.repository.findActiveSession(sessionId),
      this.repository.findUserForAuth(userId),
    ]);

    if (!session || session.userId !== userId || !user) {
      throw new UnauthorizedException('Session is no longer active');
    }

    return {
      sub: user.id,
      userId: user.id,
      tenantId: user.tenantId,
      username: user.username,
      email: user.email,
      sessionId,
      branchIds: user.branches.map(({ branchId }) => branchId),
      permissions: this.extractPermissions(user.roles),
    };
  }

  private createAccessToken(userId: string, sessionId: string): Promise<string> {
    return this.jwtService.signAsync({ sub: userId, sessionId });
  }

  private extractPermissions(
    roles: Array<{ role: { permissions: Array<{ permission: { code: string } }> } }>,
  ): string[] {
    return Array.from(
      new Set(
        roles.flatMap(({ role }) =>
          role.permissions.map(({ permission }) => permission.code),
        ),
      ),
    );
  }

  private createRefreshToken(): string {
    return randomBytes(48).toString('base64url');
  }

  private hashRefreshToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private getRefreshExpiry(): Date {
    const days = Number(this.config.get<string>('REFRESH_TOKEN_EXPIRES_DAYS') ?? '30');
    if (!Number.isFinite(days) || days <= 0) {
      throw new Error('REFRESH_TOKEN_EXPIRES_DAYS must be a positive number');
    }
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  }
}
