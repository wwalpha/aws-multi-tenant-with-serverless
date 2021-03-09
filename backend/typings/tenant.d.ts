export interface HealthCheck {
  service: string;
  isAlive: boolean;
}

/** create tenant request */
export interface RegistTenantRequest {
  // owner name
  ownerName: string;
  // email
  email: string;
  // company name
  companyName: string;
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
export interface RegistTenantResponse {
  status: string;
}

export interface GetTenantRequest {}

export interface GetTenantResponse {
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
  // status
  status: string;
  // tier
  tier: string;
  // cognito user pool id
  userPoolId: string;
  // cognito identity pool id
  identityPoolId: string;
}

export interface UpdateTenantRequest {}

export interface UpdateTenantResponse {}

export interface DeleteTenantRequest {}

export interface DeleteTenantResponse {
  status: string;
}

/** get all tenant details request */
export interface GetAllTenantRequest {}
/** get all tenant details response */
export type GetAllTenantResponse = GetTenantResponse[];
