import AWS, { CognitoIdentity, CognitoIdentityServiceProvider } from 'aws-sdk';
import express from 'express';
import { DynamodbHelper } from 'dynamodb-helper';
import { Environments } from './consts';
import {
  createNewUser,
  deleteRole,
  getCredentialsFromToken,
  getLogger,
  getUserPoolIdFromRequest,
  lookupUserPoolData,
  provisionAdminUserWithRoles,
} from './utils';
import { User } from 'typings';

// Init the winston log level
const logger = getLogger();

// update aws config
AWS.config.update({
  region: Environments.AWS_DEFAULT_REGION,
  dynamodb: { endpoint: Environments.AWS_ENDPOINT_URL },
});

/** catch undefined errors */
export const common = async (req: express.Request, res: express.Response, app: any) => {
  logger.info(`request: ${JSON.stringify(req.body)}`);

  try {
    const results = await app(req, res);

    logger.info('response', results);

    res.status(200).send(results);
  } catch (err) {
    logger.error(err);

    res.status(400).send(err);
  }
};

/**
 * lookup user
 *
 * @param req request
 */
export const lookupUser = async (req: express.Request): Promise<User.LookupUserResponse> => {
  logger.debug('Looking up user pool data for: ' + req.params.id);

  // find user in user pool
  const user = await lookupUserPoolData(req.params.id, true);

  if (!user) {
    return { isExist: false };
  }

  return {
    isExist: true,
    identityPoolId: user.IdentityPoolId,
    userPoolId: user.UserPoolId,
    userPoolClientId: user.ClientId,
  };
};

/**
 * Get user details
 *
 * @param req request
 * @returns
 */
export const getUser = async (req: express.Request): Promise<User.GetUserResponse> => {
  logger.debug('Getting user id: ' + req.params.id);

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
  return {};
};

/**
 * Regist tenant admin user
 *
 * @param req request
 * @returns
 */
export const registTenantAdmin = async (
  req: express.Request<any, any, User.TenantAdminRegistRequest>
): Promise<User.TenantAdminRegistResponse> => {
  logger.debug('Creating tenant admin user.');

  const request = req.body;

  // create cognito user pool and identity pool
  const cognito = await provisionAdminUserWithRoles(request);

  // create admin user
  const userItem = await createNewUser(request, cognito, 'TENANT_ADMIN');

  return userItem as User.TenantAdminRegistResponse;
};

/**
 * remove all dynamodb tables
 *
 * @param req request
 * @param res response
 */
export const deleteTables = async (req: express.Request) => {
  const helper = new DynamodbHelper();

  // user table
  await helper.getClient().deleteTable({ TableName: Environments.TABLE_NAME_USER }).promise();

  // product table
  await helper.getClient().deleteTable({ TableName: Environments.TABLE_NAME_PRODUCT }).promise();

  // order table
  await helper.getClient().deleteTable({ TableName: Environments.TABLE_NAME_ORDER }).promise();

  // tenant table
  await helper.getClient().deleteTable({ TableName: Environments.TABLE_NAME_TENANT }).promise();

  return 'Initiated removal of DynamoDB Tables';
};

/**
 * Delete cognito user pool, identity pool and IAM roles
 *
 * @param req request
 */
export const deleteTenant = async (req: express.Request<any, any, User.DeleteTenantRequest>) => {
  logger.debug('Cleaning up Identity Reference Architecture');

  const { tenantId, userPoolId, identityPoolId } = req.body;

  // delete user pool
  const provider = new CognitoIdentityServiceProvider();
  await provider.deleteUserPool({ UserPoolId: userPoolId }).promise();

  // delete identity pool
  const identity = new CognitoIdentity();
  await identity.deleteIdentityPool({ IdentityPoolId: identityPoolId }).promise();

  // delete iam roles
  await deleteRole(`SaaS_${tenantId}_AdminRole`, 'AdminPolicy');
  await deleteRole(`SaaS_${tenantId}_UserRole`, 'UserPolicy');
  await deleteRole(`SaaS_${tenantId}_AuthRole`);

  const helper = new DynamodbHelper();

  // get all users
  const results = await helper.query({
    TableName: Environments.TABLE_NAME_USER,
    ProjectionExpression: 'tenantId, id',
    KeyConditionExpression: '#tenantId = :tenantId',
    ExpressionAttributeNames: {
      '#tenantId': 'tenantId',
    },
    ExpressionAttributeValues: {
      ':tenantId': tenantId,
    },
  });

  if (results.Items) {
    // remove user rows
    await helper.truncate(Environments.TABLE_NAME_USER, results.Items);
  }
};

/**
 * Get all users from cognito
 *
 * @param req request
 * @returns all users
 */
export const getUsers = async (req: express.Request): Promise<User.GetUsersResponse[]> => {
  // get credentials
  const credentials = await getCredentialsFromToken(req);
  // user pool id
  const userPoolId = getUserPoolIdFromRequest(req);

  // identity provider
  const provider = new CognitoIdentityServiceProvider({ credentials });
  // all users
  const results = await provider.listUsers({ UserPoolId: userPoolId }).promise();
  // create response
  let users = results.Users?.map<User.GetUsersResponse>((u) => ({
    userName: u.Username,
    enabled: u.Enabled,
    confirmedStatus: u.UserStatus,
    dateCreated: u.UserCreateDate,
    firstName: u.Attributes?.find((item) => item.Name === 'given_name')?.Value,
    lastName: u.Attributes?.find((item) => item.Name === 'family_name')?.Value,
    role: u.Attributes?.find((item) => item.Name === 'custom:role')?.Value,
    tier: u.Attributes?.find((item) => item.Name === 'custom:tier')?.Value,
    email: u.Attributes?.find((item) => item.Name === 'custom:email')?.Value,
  }));

  return (users ??= []);
};

// health check
export const healthCheck = async (): Promise<User.HealthCheck> => ({ service: 'User Manager', isAlive: true });
