export interface HealthCheck {
  service: string;
  isAlive: boolean;
}

export type CognitoToken = {
  sub: string;
  aud: string;
  email_verified: boolean;
  token_use: string;
  auth_time: number;
  iss: string;
  'cognito:username': string;
  exp: number;
  given_name: string;
  iat: number;
  email: string;
  'custom:tenant_id': string;
  'custom:role': string;
};

export interface UserPoolDetails {
  userPoolId: string;
  userPoolClientId: string;
  identityPoolId: string;
}

/** get credentials from user token request */
export interface UserTokenRequest {
  token: string;
}

/** get credentials from user token response */
export interface UserTokenResponse {
  /**
   * AWS access key ID.
   */
  accessKeyId: string;
  /**
   * AWS secret access key.
   */
  secretAccessKey: string;
  /**
   * AWS session token.
   */
  sessionToken?: string;
}
