import { CognitoIdentity } from 'aws-sdk';
import axios from 'axios';
import express from 'express';
import winston from 'winston';
import { IdentityInputs, IdInputs, Token } from 'typings/token';
import { decodeToken, getCredentials } from './utils';
import { LookupUserResponse } from 'typings/user';
import { CredentialsOptions } from 'aws-sdk/lib/credentials';

winston.add(new winston.transports.Console({ level: 'debug' }));

const tokenCache: Token = {};

const USER_SERVICE_ENDPOINT = process.env.USER_SERVICE_ENDPOINT;

/** catch undefined errors */
export const common = async (req: express.Request, res: express.Response, app: any) => {
  winston.info(`request: ${JSON.stringify(req.body)}`);

  try {
    const results = await app(req, res);

    res.status(200).send(results);
  } catch (err) {
    winston.error(err);

    res.status(400).send(err);
  }
};

/**
 * Get system credentials
 */
export const getSystemCredentials = async (): Promise<CredentialsOptions> => await getCredentials();

/**
 * Get access credential from the passed in request
 *
 * @param req A request
 * @returns The access credentials
 */
// export const getCredentialsFromToken = async (req: express.Request) => {
//   const bearerToken = req.get('Authorization');

//   if (!bearerToken) return undefined;

//   const tokenValue = bearerToken.substring(bearerToken.indexOf(' ') + 1);

//   // in cache
//   if (tokenValue in tokenCache) {
//     winston.debug('Getting credentials from cache');

//     return tokenCache[tokenValue];
//   }

//   // decode token
//   const token = decodeToken(tokenValue);
//   // get username
//   const username = token['cognito:username'];
//   // get userpool
//   const userInfo = await getUserPoolWithParams(username);
//   // get
//   return await authenticateUserInPool(null, tokenValue);
// };

// /**
//  * Authenticate the user in the user pool
//  * @param userPool The pool to use for authentication
//  * @param idToken The id token for this session
//  */
// const authenticateUserInPool = async (userPool: any, idToken: string) => {
//   const token = decodeToken(idToken);

//   const provider = token.iss.replace('https://', '');

//   const result = await getId({
//     token: idToken,
//     provider: provider,
//     IdentityPoolId: userPool.IdentityPoolId,
//   });

//   if (!result.IdentityId) throw new Error('Can not found identity.');

//   const identity = await getCredentialsForIdentity({
//     IdentityId: result.IdentityId,
//     token: idToken,
//     provider: provider,
//   });

//   return {
//     claim: identity.Credentials,
//   };
// };

// /**
//  * Get AWS Credentials with Cognito Federated Identity and ID Token
//  * @param IdentityPoolId The Identity Pool ID
//  * @param idToken The id token for this session
//  * @param callback The callback for completion
//  */
// const getCredentialsForIdentity = async (event: IdentityInputs) => {
//   const client = new CognitoIdentity();

//   return await client
//     .getCredentialsForIdentity({
//       IdentityId: event.IdentityId,
//       Logins: {
//         [event.provider]: event.token,
//       },
//     })
//     .promise();
// };

// /**
//  * Get Cognito Federated identity
//  *
//  * @param IdentityPoolId The Identity Pool ID
//  * @param AccountId The AWS Account Number
//  * @param Logins Provider Map Provider : ID Token
//  */
// const getId = async (event: IdInputs) => {
//   const client = new CognitoIdentity();

//   client.getId({
//     IdentityPoolId: provider,
//   });
//   return await client
//     .getId({
//       IdentityPoolId: event.IdentityPoolId,
//       Logins: {
//         [event.provider]: event.token,
//       },
//     })
//     .promise();
// };

// /**
//  * Lookup the user pool from a user name
//  *
//  * @param username The username to lookup
//  * @return params object with user pool and idToken
//  */
// export const getUserPoolWithParams = async (userName: string) => {
//   const userURL = `${USER_SERVICE_ENDPOINT}/pool/${userName}`;

//   try {
//     const response = await axios.get<LookupUserResponse>(userURL);

//     if (response.status !== 200) {
//       throw new Error();
//     }

//     return response.data;
//   } catch (err) {
//     throw new Error('Error loading user: ' + err);
//   }
// };
