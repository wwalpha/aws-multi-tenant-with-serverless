import { CognitoIdentity } from 'aws-sdk';
import express from 'express';
import jwtDecode from 'jwt-decode';
import axios from 'axios';
import winston from 'winston';
import { Endpoints, Environments } from './consts';
import { Token, User } from 'typings';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: {
    service: 'token-service',
  },
  transports: [new winston.transports.Console({ level: 'debug' })],
});

export const getLogger = () => logger;

/**
 * Lookup the user pool from a user name
 *
 * @param username The username to lookup
 * @return params object with user pool and idToken
 */
export const getUserPoolWithParams = async (token: string, userName: string): Promise<User.LookupUserResponse> => {
  logger.debug('lookup user is exist in cognito user pool');

  const response = await axios.get<User.LookupUserResponse>(Endpoints.LOOKUP_USER(userName), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  // http error
  if (response.status !== 200) {
    throw new Error('Lookup user failed.');
  }

  logger.debug('lookup user success.');

  return response.data;
};

/**
 * Authenticate the user in the user pool
 *
 * @param cognito The pool to use for authentication
 * @param idToken The id token for this session
 */
export const authenticateUserInPool = async (
  cognito: Token.CognitoDetails,
  token: string,
  iss: string
): Promise<CognitoIdentity.Credentials | undefined> => {
  const provider = iss.replace('https://', '');
  const client = new CognitoIdentity({ region: Environments.AWS_DEFAULT_REGION });

  // get identity id
  const idResult = await client
    .getId({
      IdentityPoolId: cognito.identityPoolId as string,
      Logins: {
        [provider]: token,
      },
    })
    .promise();

  // identity id not exist
  if (!idResult.IdentityId) return undefined;

  // get credentials
  const result = await client
    .getCredentialsForIdentity({
      IdentityId: idResult.IdentityId,
      Logins: {
        [provider]: token,
      },
    })
    .promise();

  return result.Credentials;
};

/**
 * decode bearer token
 *
 * @param bearerToken bearer token
 */
export const decodeToken = (bearerToken?: string): Token.CognitoToken => {
  // not found
  if (!bearerToken) throw new Error(`BearerToken token not exist.`);

  // convert
  const token = bearerToken.substring(bearerToken.indexOf(' ') + 1);
  // decode jwt token
  const decodedToken = jwtDecode<Token.CognitoToken | undefined>(token);

  // decode failed
  if (!decodedToken) throw new Error(`Decode token failed. ${bearerToken}`);

  return decodedToken;
};

/**
 * Extract an id token from a request, decode it and extract the tenant id from the token.
 *
 * @param req A request
 * @returns A tenant Id
 */
export const getTenantId = (req: express.Request) => {
  // get token
  const bearerToken = req.get('Authorization');

  // decode token
  const token = decodeToken(bearerToken);

  // return tenant id
  return token['custom:tenant_id'];
};

/**
 * Extract an id token from a request, decode it and extract the user role id from the token.
 *
 * @param req A request
 * @returns A role
 */
// export const getUserRole = (req: express.Request) => {
//   // get token
//   const bearerToken = req.get('Authorization');

//   // decode token
//   const token = decodeToken(bearerToken);

//   // get value
//   const role = token['custom:role'];

//   return role !== undefined ? role : 'unknown';
// };

/**
 * Decode and token and extract the user's full name from the token.
 * @param idToken A bearer token
 * @returns The user's full name
 */
// export const getUserFullName = (bearerToken?: string) => {
//   const token = decodeToken(bearerToken);

//   // no keys
//   if (Object.keys(token).length === 0) return '';

//   return { firstName: token.given_name, lastName: token.family_name };
// };

/**
 * Get the authorization token from a request
 * @param req The request with the authorization header
 * @returns The user's email address
 */
// export const getRequestAuthToken = (req: express.Request) => {
//   const authHeader = req.get('Authorization');

//   // required check
//   if (!authHeader) return '';

//   return authHeader.substring(authHeader.indexOf(' ') + 1);
// };

/**
 * Decode token and validate access
 * @param bearerToken A bearer token
 * @returns The users access is provided
 */
// export const checkRole = (bearerToken?: string) => {
//   // check parameter
//   if (!bearerToken) return {};
//   // decode jwt token
//   const token = decodeToken(bearerToken);
//   // check result
//   if (!token['custom:role']) return {};

//   return token['custom:role'];
// };

// /**
//  * Decode and token and extract the token
//  * @param bearerToken A bearer token
//  * @returns The user's full name
//  */
// export const decodeOpenID = (bearerToken?: string) => {
//   // check parameter
//   if (!bearerToken) return {};
//   // decode jwt token
//   const token = decodeToken(bearerToken);

//   return token;
// };
