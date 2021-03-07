import express from 'express';
import winston from 'winston';
import { authenticateUserInPool, decodeToken, getUserPoolWithParams } from './utils';
import { Token } from 'typings';

winston.add(new winston.transports.Console({ level: 'debug' }));

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

// health check
export const healthCheck = async (): Promise<Token.HealthCheck> => ({ service: 'Token Manager', isAlive: true });

/**
 * Get access credential from the passed in request
 *
 * @param req A request
 * @returns The access credentials
 */
export const getCredentialsFromToken = async (req: express.Request): Promise<Token.UserTokenResponse | undefined> => {
  const request = req.body as Token.UserTokenRequest;

  // validate
  if (!request.token) throw new Error('Token is required.');

  // in cache
  // if (tokenValue in tokenCache) {
  //   winston.debug('Getting credentials from cache');

  //   return tokenCache[tokenValue];
  // }

  // decode token
  const token = decodeToken(request.token);
  console.log(token);
  // get username
  const username = token['cognito:username'];
  // get userpool infos
  const userInfo = await getUserPoolWithParams(username);
  console.log(userInfo);
  // get
  const credetials = await authenticateUserInPool(userInfo, request.token, token.iss);

  console.log(credetials);
  if (!credetials) throw new Error('Credentials create failure.');

  return {
    accessKeyId: credetials.AccessKeyId as string,
    secretAccessKey: credetials.SecretKey as string,
    sessionToken: credetials.SessionToken,
  };
};
