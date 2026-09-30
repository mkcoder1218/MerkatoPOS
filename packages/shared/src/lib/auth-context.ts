export interface AuthContext {
  userId: string;
  tenantId: string;
  branchIds: string[];
  permissions: string[];
}
