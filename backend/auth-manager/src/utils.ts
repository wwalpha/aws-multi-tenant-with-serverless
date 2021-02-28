import {
  CognitoUser,
  AuthenticationDetails,
  CognitoUserSession,
  IAuthenticationCallback,
} from 'amazon-cognito-identity-js';
import { UserLoginRequest, AuthenticateFailure } from 'typings';

export const authenticateUser = (
  request: UserLoginRequest,
  cognitoUser: CognitoUser,
  authDetails: AuthenticationDetails
) =>
  new Promise<CognitoUserSession | AuthenticateFailure>((resolve, reject) => {
    // authenticate callback
    const callback: IAuthenticationCallback = {
      onSuccess: (session: CognitoUserSession) => resolve(session),
      mfaRequired: () => {
        if (!request.mfaCode) {
          // @ts-ignore
          resolve({ mfaRequired: true });
          return;
        }

        cognitoUser.sendMFACode(request.mfaCode, callback);
      },
      newPasswordRequired: (userAttributes: any) => {
        if (!request.newPassword) {
          // @ts-ignore
          resolve({ mfaRequired: true });
          return;
        }

        // These attributes are not mutable and should be removed from map.
        delete userAttributes.email_verified;
        delete userAttributes['custom:tenant_id'];

        cognitoUser.completeNewPasswordChallenge(request.newPassword, userAttributes, callback);
      },
      onFailure: (err) => reject(err),
    };

    cognitoUser.authenticateUser(authDetails, callback);
  });

export const isAuthenticateFailure = (value: any): boolean => {
  return 'newPasswordRequired' in value || 'mfaRequired' in value;
};
