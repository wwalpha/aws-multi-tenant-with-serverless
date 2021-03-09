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
  email: string;
  tier: string;
}

export interface TenantAdminRegistResponse {
  /** Tenant Id */
  tenantId: string;
  /** Cognito User Pool Id */
  userPoolId: string;
  /** Cognito User Pool Client Id */
  clientId: string;
  /** Cognito Identity Pool Id */
  identityPoolId: string;
  /** user id */
  id: string;
  /** user name */
  userName: string;
  /** email */
  email: string;
  /** first name */
  firstName: string;
  /** last name */
  lastName: string;
  /** tier */
  tier: string;
  /** role */
  role: string;
  /** cognito user sub */
  sub: string;
}

export interface CognitoInfos {
  UserPoolId: string;
  ClientId: string;
  IdentityPoolId: string;
}

export interface LookupUserRequest {}

export interface LookupUserResponse {
  /** is user exist */
  isExist: boolean;
  /** user pool id */
  userPoolId?: string;
  /** user pool client id */
  userPoolClientId?: string;
  /** identity pool id */
  identityPoolId?: string;
}

export interface GetUserRequest {}

export interface GetUserResponse {}

export interface DeleteTenantRequest {
  /** tenant id */
  tenantId: string;
  /** user pool id */
  userPoolId: string;
  /** identity pool id */
  identityPoolId: string;
}

/**
 * Cognito User Details
 */
export interface GetUsersResponse {
  /** Username */
  userName?: string;
  /** User enabled */
  enabled?: boolean;
  /** User status */
  confirmedStatus?: string;
  /** User created date */
  dateCreated?: Date;
  /** User first name */
  firstName?: string;
  /** User last name */
  lastName?: string;
  /** Email */
  email?: string;
  /** Role */
  role?: string;
  /** Tier */
  tier?: string;
}
