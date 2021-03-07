export interface HealthCheck {
  service: string;
  isAlive: boolean;
}

export interface TenantAdminRegistRequest {
  tenantId: string;
  companyName: string;
  userName: string;
  firstName: string;
  lastName: string;
  tier: string;
}

export interface TenantAdminRegistResponse {
  tenantId: string;
}

export interface CognitoInfos {
  UserPoolId: string;
  ClientId: string;
  IdentityPoolId: string;
}

export interface LookupUserRequest {}

export interface LookupUserResponse {
  isExist: boolean;
}

export interface GetUserRequest {}

export interface GetUserResponse {}
