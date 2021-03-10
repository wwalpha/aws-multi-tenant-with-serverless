export interface HealthCheck {
  service: string;
  isAlive: boolean;
}

export interface TenantUser {
  /** tenant id */
  tenantId: string;
  /** company name */
  companyName: string;
  /** username */
  username: string;
  /** first name */
  firstName: string;
  /** last name */
  lastName: string;
  /** email */
  email: string;
  /** tier */
  tier: string;
}

/** Cognito User Details */
export interface CognitoUser {
  /** user name */
  userName: string;
  /** status */
  enabled: boolean;
  /** user status */
  status: string;
  /** user created date */
  createDate?: Date;
  /** first name */
  firstName: string;
  /** last name */
  lastName: string;
  /** user role */
  role: string;
  /** user tier */
  tier: string;
  /** user email */
  email: string;
}

export interface CreateAdminRequest extends TenantUser {}

export interface CreateAdminResponse {
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
  /** email */
  email: string;
  /** company name */
  companyName: string;
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
  ClientId?: string;
  IdentityPoolId?: string;
}

export interface TenantInfos extends CognitoInfos {
  AuthRoleArn: string;
  AdminRoleArn: string;
  UserRoleArn: string;
}

export interface LookupUserRequest {}

export interface LookupUserResponse {
  /** is user exist */
  isExist: boolean;
  /** user pool id */
  userPoolId?: string;
  /** user pool client id */
  clientId?: string;
  /** identity pool id */
  identityPoolId?: string;
}

export interface CreateUserRequest extends TenantUser {}

export interface CreateUserResponse extends TenantUser {
  userName: string;
}

export interface GetUserRequest {}

export interface GetUserResponse {
  /** user name */
  userName: string;
  /** status */
  enabled: boolean;
  /** user status */
  status: string;
  /** first name */
  firstName: string;
  /** last name */
  lastName: string;
}

export interface UpdateUserRequest {
  /** user status */
  status: string;
  /** first name */
  firstName: string;
  /** last name */
  lastName: string;
}

export interface UpdateUserResponse {
  status: string;
}

export interface DeleteUserRequest {}

export interface DeleteUserResponse {
  status: string;
}

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
export type GetUsersResponse = GetUserResponse[];
