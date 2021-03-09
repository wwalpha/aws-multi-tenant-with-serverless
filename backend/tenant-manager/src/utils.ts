import { CredentialsOptions } from 'aws-sdk/lib/credentials';
import express from 'express';
import axios from 'axios';
import { Endpoints } from './consts';
import { Token } from 'typings';

/**
 * get credetials from user token
 *
 * @param req request
 */
export const getCredentialsFromToken = async (req: express.Request): Promise<CredentialsOptions> => {
  const bearerToken = req.get('Authorization');

  if (!bearerToken) {
    throw new Error('Bearer token not found.');
  }

  // get token
  const token = bearerToken.split(' ')[1];

  // get credentials from user token
  const res = await axios.post<Token.UserTokenResponse>(Endpoints.CREDENTIALS_FROM_TOKEN, {
    token,
  });

  return {
    accessKeyId: res.data.accessKeyId,
    secretAccessKey: res.data.secretAccessKey,
    sessionToken: res.data.sessionToken,
  };
};
