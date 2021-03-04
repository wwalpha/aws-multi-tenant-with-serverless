export interface TenantAdminRegistRequest {
  tenantId: string;
}

export interface Credentials {
  claim: {
    SessionToken?: string;
    AccessKeyId?: string;
    SecretAccessKey?: string;
  };
}

export interface LookupUserRequest {}

export interface LookupUserResponse {
  // tenant id
  tenantId: string;
  // identity pool id
  identityPoolId: string;
  // user pool id
  userPoolId: string;
  // user pool client id
  userPoolClientId: string;
}
