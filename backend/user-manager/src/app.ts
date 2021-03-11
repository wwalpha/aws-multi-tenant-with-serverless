import AWS, { CognitoIdentity, CognitoIdentityServiceProvider } from 'aws-sdk';
import { defaultTo } from 'lodash';
import express from 'express';
import { DynamodbHelper } from 'dynamodb-helper';
import { Environments } from './consts';
import {
  createNewUser,
  deleteRole,
  getCredentialsFromToken,
  getLogger,
  lookupUserPoolData,
  provisionAdminUserWithRoles,
  provisionSystemAdminUserWithRoles,
} from './utils';
import { User } from 'typings';
import { getTenantIdFromToken, getUserPoolIdFromToken } from './token';
import { deleteCognitoUser, getCognitoUser, listCognitoUsers, updateCognitoUser } from './cognito';

// Init the winston log level
const logger = getLogger();

// update aws config
AWS.config.update({
  region: Environments.AWS_DEFAULT_REGION,
  dynamodb: { endpoint: Environments.AWS_ENDPOINT_URL },
});

/**
 * lookup user in cognito
 *
 * @param req request
 */
export const lookupUser = async (req: express.Request): Promise<User.LookupUserResponse> => {
  logger.debug('Looking up user pool data for: ' + req.params.id);

  // find user in user pool
  const user = await lookupUserPoolData(req.params.id, true);

  // lookup user response
  return {
    isExist: user !== undefined,
    identityPoolId: user?.IdentityPoolId,
    userPoolId: user?.UserPoolId,
    clientId: user?.ClientId,
  };
};

/**
 * Create a tenant admin user
 *
 * @param req request
 * @returns
 */
export const createTenantAdmin = async (
  req: express.Request<any, any, User.CreateAdminRequest>
): Promise<User.CreateAdminResponse> => {
  logger.debug('Creating a tenant admin user.');

  const request = req.body;

  // create cognito user pool and identity pool
  const cognito = await provisionAdminUserWithRoles(request);
  // create admin user
  const userItem = await createNewUser(request, cognito, 'TENANT_ADMIN');

  return userItem as User.CreateAdminResponse;
};

/**
 * Create a system admin user
 *
 * @param req request
 * @returns
 */
export const createSystemAdmin = async (
  req: express.Request<any, any, User.CreateAdminRequest>
): Promise<User.CreateAdminResponse> => {
  logger.debug('Creating a system admin user.');

  const request = req.body;

  // create cognito user pool and identity pool
  const cognito = await provisionSystemAdminUserWithRoles(request);
  // create admin user
  const userItem = await createNewUser(request, cognito, 'TENANT_ADMIN');

  return userItem as User.CreateAdminResponse;
};

/**
 * Get all users in cognito
 *
 * @param req request
 * @returns all users
 */
export const getUsers = async (req: express.Request): Promise<User.GetUsersResponse> => {
  // get credentials
  const credentials = await getCredentialsFromToken(req);
  // user pool id
  const userPoolId = getUserPoolIdFromToken(req);
  // get cognito users
  const users = await listCognitoUsers(userPoolId, credentials);

  // return all items
  return users.map<User.GetUserResponse>((item) => ({
    userName: item.userName,
    enabled: item.enabled,
    status: item.status,
    firstName: item.firstName,
    lastName: item.lastName,
  }));
};

/**
 * Create a new user
 *
 * @param req request
 * @returns created user details
 */
export const createUser = async (
  req: express.Request<any, any, User.CreateUserRequest>
): Promise<User.CreateUserResponse> => {
  logger.debug(`Creating user: ${req.body.email}`);
  // get user credentials
  const credentials = await getCredentialsFromToken(req);
  // get pool id
  const userPoolId = getUserPoolIdFromToken(req);
  // create new user
  const user = await createNewUser(req.body, { UserPoolId: userPoolId }, 'TENANT_USER', credentials);

  return {
    tenantId: user.tenantId,
    companyName: user.companyName,
    userName: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    tier: user.tier,
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

  const credentials = await getCredentialsFromToken(req);
  const tenantId = getTenantIdFromToken(req);

  // check user exists
  const cognito = await lookupUserPoolData(req.params.id, false, tenantId, credentials);

  // error check
  if (!cognito) throw new Error(`User not found: ${req.params.id}`);

  const user = await getCognitoUser(cognito.UserPoolId, req.params.id, credentials);

  return {
    userName: user.userName,
    enabled: defaultTo(user.enabled, false),
    firstName: defaultTo(user.firstName, ''),
    lastName: defaultTo(user.lastName, ''),
    status: defaultTo(user.status, ''),
  };
};

/**
 * update user details
 *
 * @param req request
 * @returns created user details
 */
export const updateUser = async (
  req: express.Request<any, any, User.UpdateUserRequest>
): Promise<User.UpdateUserResponse> => {
  // get user credentials
  const credentials = await getCredentialsFromToken(req);
  // tenant id
  const tenantId = getTenantIdFromToken(req);
  // check user exists
  const cognito = await lookupUserPoolData(req.params.id, false, tenantId, credentials);

  // error check
  if (!cognito) throw new Error(`User not found: ${req.params.id}`);

  // update user details
  await updateCognitoUser(cognito.UserPoolId, req.body, credentials);

  return {
    status: 'success',
  };
};

/**
 * delete a cognito user
 *
 * @param req request
 */
export const deleteUser = async (req: express.Request): Promise<User.DeleteUserResponse> => {
  const userName = req.params.id;

  // get user credentials
  const credentials = await getCredentialsFromToken(req);
  // tenant id
  const tenantId = getTenantIdFromToken(req);
  // check user exists
  const cognito = await lookupUserPoolData(req.params.id, false, tenantId, credentials);

  // error check
  if (!cognito) throw new Error(`User not found: ${req.params.id}`);

  // delete user
  await deleteCognitoUser(cognito.UserPoolId, userName, credentials);

  return {
    status: 'success',
  };
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

// health check
export const healthCheck = async (): Promise<User.HealthCheck> => ({ service: 'User Manager', isAlive: true });
