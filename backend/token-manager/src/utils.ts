import { Config } from 'aws-sdk';
import { CredentialsOptions } from 'aws-sdk/lib/credentials';
import express from 'express';
import jwtDecode from 'jwt-decode';
import winston from 'winston';
import { Token } from 'typings/token';

winston.add(new winston.transports.Console({ level: 'debug' }));

/**
 * decode bearer token
 *
 * @param bearerToken bearer token
 */
export const decodeToken = (bearerToken?: string): Token => {
  // not found
  if (!bearerToken) return {};

  // convert
  const token = bearerToken.substring(bearerToken.indexOf(' ') + 1);
  // decode jwt token
  const decodedToken = jwtDecode<Token | undefined>(token);

  // decode failed
  if (!decodedToken) return {};

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
export const getUserRole = (req: express.Request) => {
  // get token
  const bearerToken = req.get('Authorization');

  // decode token
  const token = decodeToken(bearerToken);

  // get value
  const role = token['custom:role'];

  return role !== undefined ? role : 'unknown';
};

/**
 * Decode and token and extract the user's full name from the token.
 * @param idToken A bearer token
 * @returns The user's full name
 */
export const getUserFullName = (bearerToken?: string) => {
  const token = decodeToken(bearerToken);

  // no keys
  if (Object.keys(token).length === 0) return '';

  return { firstName: token.given_name, lastName: token.family_name };
};

/**
 * Get the authorization token from a request
 * @param req The request with the authorization header
 * @returns The user's email address
 */
export const getRequestAuthToken = (req: express.Request) => {
  const authHeader = req.get('Authorization');

  // required check
  if (!authHeader) return '';

  return authHeader.substring(authHeader.indexOf(' ') + 1);
};

/**
 * Decode token and validate access
 * @param bearerToken A bearer token
 * @returns The users access is provided
 */
export const checkRole = (bearerToken?: string) => {
  // check parameter
  if (!bearerToken) return {};
  // decode jwt token
  const token = decodeToken(bearerToken);
  // check result
  if (!token['custom:role']) return {};

  return token['custom:role'];
};

/**
 * Decode and token and extract the token
 * @param bearerToken A bearer token
 * @returns The user's full name
 */
export const decodeOpenID = (bearerToken?: string) => {
  // check parameter
  if (!bearerToken) return {};
  // decode jwt token
  const token = decodeToken(bearerToken);

  return token;
};

export const getCredentials = () =>
  new Promise<CredentialsOptions>((resolve, reject) => {
    const config = new Config();

    config.getCredentials((err, credentials) => {
      if (err) {
        winston.debug('Unable to Obtain Credentials');

        reject(err);
        return;
      }

      // error check
      if (!credentials) {
        reject(new Error('Unable to Obtain Credentials'));
        return;
      }

      resolve(credentials);
    });
  });
