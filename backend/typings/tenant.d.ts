import { TenantItem } from './tables';

export interface HealthCheck {
  service: string;
  isAlive: boolean;
}

/** create tenant request */
export interface CreateTenantRequest {
  id: string;
  // owner name
  ownerName: string;
  // email
  email: string;
  // company name
  companyName: string;
  // first name
  firstName: string;
  // last name
  lastName: string;
  // tier
  tier: string;
  // cognito user pool id
  userPoolId: string;
  // cognito user pool client id
  clientId: string;
  // cognito identity pool id
  identityPoolId: string;
}

/** create tenant response */
export interface CreateTenantResponse {
  status: string;
}

export interface GetTenantRequest {}

export interface GetTenantResponse {
  // tenant id
  id: string;
  // owner name
  ownerName: string;
  // first name
  firstName: string;
  // last name
  lastName: string;
  // email
  email: string;
  // company name
  companyName: string;
  // status
  status: string;
  // tier
  tier: string;
  // cognito user pool id
  userPoolId: string;
  // cognito user pool client id
  clientId: string;
  // cognito identity pool id
  identityPoolId: string;
}

export interface UpdateTenantRequest {
  companyName: string;
  tier: string;
}

export interface UpdateTenantResponse {
  companyName: string;
  tier: string;
}

export interface DeleteTenantRequest {}

export interface DeleteTenantResponse {
  status: string;
}

/** get all tenant details request */
export interface GetAllTenantRequest {}
/** get all tenant details response */
export type GetAllTenantResponse = GetTenantResponse[];
