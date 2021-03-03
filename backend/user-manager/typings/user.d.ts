import { CredentialsOptions } from 'aws-sdk/lib/credentials';

export interface Credentials {
  claim: CredentialsOptions;
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

export interface LookupUserResponse {}
