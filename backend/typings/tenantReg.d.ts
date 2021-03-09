export interface RegistTenantRequest {
  /** email address */
  email: string;
  /** company name */
  companyName: string;
  /** first name */
  firstName: string;
  /** last name */
  lastName: string;
  /** tier */
  tier: string;
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
