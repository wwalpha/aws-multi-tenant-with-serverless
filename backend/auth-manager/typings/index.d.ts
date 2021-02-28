export interface UserLoginRequest {
  username: string;
  password: string;
  mfaCode: string;
  newPassword: string;
}

export interface UserPoolInfo {
  clientId: string;
  userPoolId: string;
}

export interface AuthenticateFailure {
  newPasswordRequired?: boolean;
  mfaRequired?: boolean;
}
