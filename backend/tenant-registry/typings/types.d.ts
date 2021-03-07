export interface RegistTenantRequest {
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
