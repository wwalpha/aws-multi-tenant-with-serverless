import { CredentialsOptions } from 'aws-sdk/lib/credentials';

export type Token = { [key: string]: string };

export type IdInputs = {
  IdentityPoolId: string;
  provider: string;
  token: string;
};

export type IdentityInputs = {
  IdentityId: string;
  provider: string;
  token: string;
};

/** get credentials from user token request */
export interface UserTokenRequest {
  token: string;
}

/** get credentials from user token response */
export interface UserTokenResponse extends CredentialsOptions {}
