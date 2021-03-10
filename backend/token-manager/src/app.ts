import express from 'express';
import { authenticateUserInPool, decodeToken, getLogger, getUserPoolWithParams } from './utils';
import { Token } from 'typings';

const logger = getLogger();

/** catch undefined errors */
export const common = async (req: express.Request, res: express.Response, app: any) => {
  logger.info('request', req.body);

  try {
    const results = await app(req, res);

    logger.info('response', results);

    res.status(200).send(results);
  } catch (err) {
    logger.error('Unhandle error', err);

    res.status(400).send(err.message);
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
export const getCredentialsFromToken = async (req: express.Request): Promise<Token.UserTokenResponse> => {
  logger.debug('get credentails from authorization token');

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

  // get username
  const username = token['cognito:username'];
  // get userpool infos
  const userInfo = await getUserPoolWithParams(request.token, username);
  // get
  const credetials = await authenticateUserInPool(userInfo, request.token, token.iss);

  if (!credetials) throw new Error('Credentials create failure.');

  logger.debug('retrive credentials success.');

  return {
    accessKeyId: credetials.AccessKeyId as string,
    secretAccessKey: credetials.SecretKey as string,
    sessionToken: credetials.SessionToken,
  };
};
