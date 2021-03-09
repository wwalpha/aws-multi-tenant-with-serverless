export interface RegistTenantRequest {
  userName: string;
  companyName: string;
  firstName: string;
  lastName: string;
  tier: string;
  email: string;
}

export interface RegistTenantResponse {
  tenantId?: string;
  companyName: string;
  accountName: string;
  ownerName: string;
  tier: string;
  email: string;
  userName: string;
  role?: string;
  firstName: string;
  lastName: string;
}
