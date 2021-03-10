import { Credentials } from 'aws-sdk';
import express from 'express';
import axios from 'axios';
import winston from 'winston';
import { Endpoints } from './consts';
import { Token } from 'typings';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: {
    service: 'tenant-service',
  },
  transports: [new winston.transports.Console({ level: 'debug' })],
});

export const getLogger = () => logger;

/**
 * get credetials from user token
 *
 * @param req request
 */
export const getCredentialsFromToken = async (req: express.Request): Promise<Credentials> => {
  const bearerToken = req.get('Authorization');

  if (!bearerToken) {
    throw new Error('Authorization token not found.');
  }

  // get token
  const token = bearerToken.split(' ')[1];

  // get credentials from user token
  const res = await axios.post<Token.UserTokenResponse>(Endpoints.CREDENTIALS_FROM_TOKEN, {
    token,
  });

  return new Credentials({
    accessKeyId: res.data.accessKeyId,
    secretAccessKey: res.data.secretAccessKey,
    sessionToken: res.data.sessionToken,
  });
};
