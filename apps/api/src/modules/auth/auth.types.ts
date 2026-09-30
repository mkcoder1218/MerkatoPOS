import type { AuthContext } from '@merkatopos/shared';

export interface JwtPayload extends AuthContext {
  sub: string;
  email: string;
}

export interface AuthenticatedRequest {
  user: JwtPayload;
  headers: Record<string, string | string[] | undefined>;
}
