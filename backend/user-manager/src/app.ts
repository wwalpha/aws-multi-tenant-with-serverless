import AWS from 'aws-sdk';
import express from 'express';
import winston from 'winston';
import { createNewUser, getSystemCredentials, lookupUserPoolData, provisionAdminUserWithRoles } from './utils';
import { User } from 'typings';

// Init the winston log level
winston.add(new winston.transports.Console({ level: 'debug' }));
// Init region
AWS.config.update({
  region: process.env.AWS_DEFAULT_REGION,
});

export const healthCheck = (_: express.Request, res: express.Response) => {
  res.status(200).send({ service: 'User Manager', isAlive: true });
};

/**
 * find user
 *
 * @param req
 * @param res
 */
export const lookupUser = async (req: express.Request, res: express.Response) => {
  winston.debug('Looking up user pool data for: ' + req.params.id);

  const credentials = await getSystemCredentials();

  const user = await lookupUserPoolData(credentials, req.params.id, true);

  if (!user) {
    res.status(400).send(JSON.stringify({ Error: 'User not found' }));
    return;
  }

  res.status(200).send(user);
};

export const getUser = async (req: express.Request, res: express.Response) => {
  winston.debug('Getting user id: ' + req.params.id);

  // tokenManager.getCredentialsFromToken(req, function (credentials) {
  //   // get the tenant id from the request
  //   var tenantId = tokenManager.getTenantId(req);

  //   lookupUserPoolData(credentials, req.params.id, tenantId, false, function (err, user) {
  //     if (err) res.status(400).send('{"Error" : "Error getting user"}');
  //     else {
  //       cognitoUsers.getCognitoUser(credentials, user, function (err, user) {
  //         if (err) {
  //           res.status(400);
  //           res.json('Error lookup user user: ' + req.params.id);
  //         } else {
  //           res.json(user);
  //         }
  //       });
  //     }
  //   });
  // });
  res.json({});
};

export const registTenantAdmin = async (req: express.Request, res: express.Response) => {
  const request = req.body as User.TenantAdminRegistRequest;

  console.log('req.body', request);

  // get the credentials for the system user
  const credentials = await getSystemCredentials();

  try {
    // create cognito user pool and identity pool
    const cognito = await provisionAdminUserWithRoles(request, credentials);

    // create admin user
    const user = await createNewUser(credentials, request, cognito, 'TENANT_ADMIN');

    res.status(200).send(user);
  } catch (err) {
    console.log(err);
    res.status(400).send(err);
  }
};
