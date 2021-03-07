import { TenantItem } from './tables';

export interface HealthCheck {
  service: string;
  isAlive: boolean;
}

/** create tenant request */
export interface RegistTenantRequest {
  // cognito user pool id
  userPoolId: string;
  // cognito identity pool id
  identityPoolId: string;
  // owner name
  ownerName: string;
  // account name
  accountName: string;
  // username
  userName: string;
  // email
  email: string;
  // company name
  companyName: string;
  // tier
  tier: string;
}

/** create tenant response */
export interface RegistTenantResponse {
  status: string;
}

export interface GetTenantRequest {}

export interface GetTenantResponse extends TenantItem {}

export interface UpdateTenantRequest {}

export interface UpdateTenantResponse {}

export interface DeleteTenantRequest {}

export interface DeleteTenantResponse {
  status: string;
}
