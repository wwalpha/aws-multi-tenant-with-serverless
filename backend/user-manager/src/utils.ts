import AWS, { Credentials, IAM } from 'aws-sdk';
import express from 'express';
import axios from 'axios';
import winston from 'winston';
import { DynamodbHelper } from 'dynamodb-helper';
import {
  TENANT_ADMIN_POLICY,
  COGNITO_PRINCIPALS,
  Environments,
  TENANT_USER_POLICY,
  SYSTEM_ADMIN_POLICY,
  SYSTEM_USER_POLICY,
} from './consts';
import {
  createCognitoUser,
  createIdentiyPool,
  createUserPool,
  createUserPoolClient,
  setIdentityPoolRoles,
} from './cognito';
import { Tables, Token, User } from 'typings';
import { defaultTo } from 'lodash';

// update aws config
AWS.config.update({
  region: Environments.AWS_DEFAULT_REGION,
  dynamodb: { endpoint: Environments.AWS_ENDPOINT_URL },
});

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: {
    service: 'user-service',
  },
  transports: [new winston.transports.Console({ level: 'debug' })],
});

export const getLogger = () => logger;

/** catch undefined errors */
export const common = async (req: express.Request, res: express.Response, app: any) => {
  // logger.info(`request: ${JSON.stringify(req.body)}`);
  logger.info('request', req.body);

  try {
    const results = await app(req, res);

    logger.info('response', results);

    res.status(200).send(results);
  } catch (err) {
    logger.error('unhandled error:', err);

    const message = defaultTo(err.response?.data, err.message);

    res.status(400).send(message);
  }
};

/**
 * provision cognito and admin user by system credentials
 *
 * @param request
 */
export const provisionAdminUserWithRoles = async (request: User.CreateAdminRequest): Promise<User.TenantInfos> => {
  logger.debug('Provision admin user with roles.');

  // create user pool
  const userPool = await createUserPool(request.tenantId);
  // user pool id
  const userPoolId = userPool.Id as string;

  // create user pool client
  const userPoolClient = await createUserPoolClient(userPool);
  // user pool client id
  const clientId = userPoolClient.ClientId as string;
  // user pool client name
  const clientName = userPoolClient.ClientName as string;

  // create identity pool
  const identityPool = await createIdentiyPool(userPoolId, clientId, clientName);
  // identity pool id
  const identityPoolId = identityPool.IdentityPoolId;

  const roles = await Promise.all([
    await createAuthRole(request.tenantId, identityPool.IdentityPoolId),
    await createTenantAdminRole(request.tenantId, identityPool.IdentityPoolId),
    await createTenantUserRole(request.tenantId, identityPool.IdentityPoolId),
  ]);
  // auth role
  const authRole = roles[0];
  // admin user role
  const adminRole = roles[1];
  // normal user role
  const userRole = roles[2];

  // create identity pool
  await setIdentityPoolRoles(userPoolId, clientId, identityPoolId, authRole, adminRole, userRole);

  return {
    UserPoolId: defaultTo(userPool.Id, ''),
    ClientId: userPoolClient.ClientId,
    IdentityPoolId: identityPool.IdentityPoolId,
    AdminRoleArn: adminRole.Arn,
    UserRoleArn: userRole.Arn,
    AuthRoleArn: authRole.Arn,
  };
};

/**
 * provision cognito and system admin user
 *
 * @param request
 */
export const provisionSystemAdminUserWithRoles = async (
  request: User.CreateAdminRequest
): Promise<User.TenantInfos> => {
  logger.debug('Provision admin user with roles.');

  // create user pool
  const userPool = await createUserPool(request.tenantId);
  // user pool id
  const userPoolId = userPool.Id as string;

  // create user pool client
  const userPoolClient = await createUserPoolClient(userPool);
  // user pool client id
  const clientId = userPoolClient.ClientId as string;
  // user pool client name
  const clientName = userPoolClient.ClientName as string;

  // create identity pool
  const identityPool = await createIdentiyPool(userPoolId, clientId, clientName);
  // identity pool id
  const identityPoolId = identityPool.IdentityPoolId;

  const roles = await Promise.all([
    await createAuthRole(request.tenantId, identityPool.IdentityPoolId),
    await createSystemAdminRole(request.tenantId, identityPool.IdentityPoolId),
    await createSystemUserRole(request.tenantId, identityPool.IdentityPoolId),
  ]);
  // auth role
  const authRole = roles[0];
  // admin user role
  const adminRole = roles[1];
  // normal user role
  const userRole = roles[2];

  // create identity pool
  await setIdentityPoolRoles(userPoolId, clientId, identityPoolId, authRole, adminRole, userRole);

  return {
    UserPoolId: defaultTo(userPool.Id, ''),
    ClientId: userPoolClient.ClientId as string,
    IdentityPoolId: identityPool.IdentityPoolId,
    AdminRoleArn: adminRole.Arn,
    UserRoleArn: userRole.Arn,
    AuthRoleArn: authRole.Arn,
  };
};

/**
 * Create auth role
 *
 * @param tenantId tenant id
 * @param identityPoolId identity pool id
 */
const createAuthRole = async (tenantId: string, identityPoolId: string) => {
  const principals = COGNITO_PRINCIPALS(identityPoolId);

  const iam = new IAM();

  const userRole = await iam
    .createRole({
      RoleName: `SaaS_${tenantId}_AuthRole`,
      AssumeRolePolicyDocument: principals,
    })
    .promise();

  return userRole.Role;
};

/**
 * Create admin user role
 *
 * @param tenantId tenant id
 * @param identityPoolId identity pool id
 * @param userpoolArn userpool arn
 */
const createTenantAdminRole = async (tenantId: string, identityPoolId: string, userpoolArn: string = '') => {
  logger.debug('Provision tenant admin role...');

  const principals = COGNITO_PRINCIPALS(identityPoolId);

  const helper = new DynamodbHelper();
  const client = helper.getClient();

  const tables = await Promise.all([
    client.describeTable({ TableName: Environments.TABLE_NAME_USER }).promise(),
    client.describeTable({ TableName: Environments.TABLE_NAME_ORDER }).promise(),
    client.describeTable({ TableName: Environments.TABLE_NAME_PRODUCT }).promise(),
  ]);

  logger.debug(`Tenant table arn: ${tables[0].Table?.TableArn}`);
  logger.debug(`Tenant table arn: ${tables[1].Table?.TableArn}`);
  logger.debug(`Tenant table arn: ${tables[2].Table?.TableArn}`);

  const adminPolicy = TENANT_ADMIN_POLICY(
    tenantId,
    userpoolArn,
    tables[0].Table?.TableArn,
    tables[1].Table?.TableArn,
    tables[2].Table?.TableArn
  );

  const iam = new IAM();

  const adminRole = await iam
    .createRole({
      RoleName: `SaaS_${tenantId}_AdminRole`,
      AssumeRolePolicyDocument: principals,
    })
    .promise();

  await iam
    .putRolePolicy({
      RoleName: adminRole.Role.RoleName,
      PolicyName: 'AdminPolicy',
      PolicyDocument: adminPolicy,
    })
    .promise();

  return adminRole.Role;
};

/**
 * Create tenant user role
 *
 * @param tenantId tenant id
 * @param identityPoolId identity pool id
 * @param userpoolArn userpool arn
 */
const createTenantUserRole = async (tenantId: string, identityPoolId: string, userpoolArn: string = '') => {
  logger.debug('Provision tenant user role...');

  const principals = COGNITO_PRINCIPALS(identityPoolId);

  const helper = new DynamodbHelper();
  const client = helper.getClient();

  const tables = await Promise.all([
    client.describeTable({ TableName: Environments.TABLE_NAME_USER }).promise(),
    client.describeTable({ TableName: Environments.TABLE_NAME_ORDER }).promise(),
    client.describeTable({ TableName: Environments.TABLE_NAME_PRODUCT }).promise(),
  ]);

  logger.debug(`Tenant table arn: ${tables[0].Table?.TableArn}`);
  logger.debug(`Tenant table arn: ${tables[1].Table?.TableArn}`);
  logger.debug(`Tenant table arn: ${tables[2].Table?.TableArn}`);

  const userPolicy = TENANT_USER_POLICY(
    tenantId,
    userpoolArn,
    tables[0].Table?.TableArn,
    tables[1].Table?.TableArn,
    tables[2].Table?.TableArn
  );

  const iam = new IAM();

  const userRole = await iam
    .createRole({
      RoleName: `SaaS_${tenantId}_UserRole`,
      AssumeRolePolicyDocument: principals,
    })
    .promise();

  await iam
    .putRolePolicy({
      RoleName: userRole.Role.RoleName,
      PolicyName: 'UserPolicy',
      PolicyDocument: userPolicy,
    })
    .promise();

  return userRole.Role;
};

/**
 * Create system admin user role
 *
 * @param tenantId tenant id
 * @param identityPoolId identity pool id
 * @param userpoolArn userpool arn
 */
const createSystemAdminRole = async (tenantId: string, identityPoolId: string) => {
  logger.debug('Provision system admin role...');

  const principals = COGNITO_PRINCIPALS(identityPoolId);

  const helper = new DynamodbHelper();
  const client = helper.getClient();

  const tables = await Promise.all([
    client.describeTable({ TableName: Environments.TABLE_NAME_TENANT }).promise(),
    client.describeTable({ TableName: Environments.TABLE_NAME_USER }).promise(),
    client.describeTable({ TableName: Environments.TABLE_NAME_ORDER }).promise(),
    client.describeTable({ TableName: Environments.TABLE_NAME_PRODUCT }).promise(),
  ]);

  logger.debug(`Tenant table arn: ${tables[0].Table?.TableArn}`);
  logger.debug(`Tenant table arn: ${tables[1].Table?.TableArn}`);
  logger.debug(`Tenant table arn: ${tables[2].Table?.TableArn}`);
  logger.debug(`Tenant table arn: ${tables[3].Table?.TableArn}`);

  const adminPolicy = SYSTEM_ADMIN_POLICY(
    tables[0].Table?.TableArn,
    tables[1].Table?.TableArn,
    tables[2].Table?.TableArn,
    tables[3].Table?.TableArn
  );

  logger.debug('System admin role policy', adminPolicy);

  const iam = new IAM();

  const adminRole = await iam
    .createRole({
      RoleName: `SaaS_${tenantId}_AdminRole`,
      AssumeRolePolicyDocument: principals,
    })
    .promise();

  await iam
    .putRolePolicy({
      RoleName: adminRole.Role.RoleName,
      PolicyName: 'AdminPolicy',
      PolicyDocument: adminPolicy,
    })
    .promise();

  return adminRole.Role;
};

/**
 * Create system user user role
 *
 * @param tenantId tenant id
 * @param identityPoolId identity pool id
 */
const createSystemUserRole = async (tenantId: string, identityPoolId: string) => {
  const principals = COGNITO_PRINCIPALS(identityPoolId);

  const helper = new DynamodbHelper();
  const client = helper.getClient();

  const results = await Promise.all([
    client.describeTable({ TableName: Environments.TABLE_NAME_TENANT }).promise(),
    client.describeTable({ TableName: Environments.TABLE_NAME_USER }).promise(),
    client.describeTable({ TableName: Environments.TABLE_NAME_ORDER }).promise(),
    client.describeTable({ TableName: Environments.TABLE_NAME_PRODUCT }).promise(),
  ]);

  const userPolicy = SYSTEM_USER_POLICY(
    results[0].Table?.TableArn,
    results[1].Table?.TableArn,
    results[2].Table?.TableArn,
    results[3].Table?.TableArn
  );

  const iam = new IAM();

  const userRole = await iam
    .createRole({
      RoleName: `SaaS_${tenantId}_UserRole`,
      AssumeRolePolicyDocument: principals,
    })
    .promise();

  await iam
    .putRolePolicy({
      RoleName: userRole.Role.RoleName,
      PolicyName: 'UserPolicy',
      PolicyDocument: userPolicy,
    })
    .promise();

  return userRole.Role;
};

/**
 * Lookup a user's pool data in the user table
 *
 * @param userId The id of the user being looked up
 * @param isSystemContext Is this being called in the context of a system user (registration, system user provisioning)
 * @param tenantId The id of the tenant (if this is not system context)
 * @param credentials The credentials used ben looking up the user
 */
export const lookupUserPoolData = async (
  userId: string,
  isSystemContext: boolean,
  tenantId?: string,
  credentials?: Credentials
): Promise<User.CognitoInfos | undefined> => {
  const helper = new DynamodbHelper({
    credentials: credentials,
  });

  if (isSystemContext) {
    const results = await helper.query({
      TableName: Environments.TABLE_NAME_USER,
      IndexName: 'gsiIdx',
      KeyConditionExpression: '#id = :id',
      ExpressionAttributeNames: {
        '#id': 'id',
      },
      ExpressionAttributeValues: {
        ':id': userId,
      },
    });

    // not found
    if (results.Count === 0 || !results.Items) {
      return undefined;
    }

    const item = results.Items[0] as Tables.UserItem;

    // user founded
    return {
      ClientId: item.clientId,
      UserPoolId: item.userPoolId,
      IdentityPoolId: item.identityPoolId,
    };
  }

  const searchParams = {
    id: userId,
    tenantId: tenantId,
  };

  // get the item from the database
  const results = await helper.get({
    TableName: Environments.TABLE_NAME_USER,
    Key: searchParams,
  });

  // not found
  if (!results || !results.Item) {
    return undefined;
  }

  const item = results.Item as Tables.UserItem;

  // user founded
  return {
    ClientId: item.clientId,
    UserPoolId: item.userPoolId,
    IdentityPoolId: item.identityPoolId,
  };
};

/**
 * Create a new user using the supplied credentials/user
 *
 * @param credentials The creds used for the user creation
 * @param userInfo the tenant admin regist request
 * @param cognito The cognito infomations
 */
export const createNewUser = async (
  userInfo: User.TenantUser,
  cognito: User.CognitoInfos,
  role: 'TENANT_ADMIN' | 'TENANT_USER',
  credentials?: Credentials
) => {
  const userItem: Tables.UserItem = {
    tenantId: userInfo.tenantId,
    id: userInfo.email,
    companyName: userInfo.companyName,
    firstName: userInfo.firstName,
    lastName: userInfo.lastName,
    email: userInfo.email,
    tier: userInfo.tier,
    role: role,
    userPoolId: cognito.UserPoolId,
    clientId: cognito.ClientId,
    identityPoolId: cognito.IdentityPoolId,
  };

  // create cognito user;
  const user = await createCognitoUser(cognito.UserPoolId, userItem, credentials);

  // set sub
  if (user.Attributes) {
    userItem.sub = user.Attributes[0].Value;
  }

  const helper = new DynamodbHelper({ credentials: credentials });

  // add user
  await helper.put({
    TableName: Environments.TABLE_NAME_USER,
    Item: userItem,
  });

  return userItem;
};

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
  const res = await axios.post<Token.UserTokenResponse>(`${Environments.SERVICE_ENDPOINT_TOKEN}/token/user`, {
    token,
  });

  return new Credentials({
    accessKeyId: res.data.accessKeyId,
    secretAccessKey: res.data.secretAccessKey,
    sessionToken: res.data.sessionToken,
  });
};

/**
 * Delete IAM Role
 *
 * @param roleName role name
 * @param policyName policy name
 */
export const deleteRole = async (roleName: string, policyName?: string) => {
  const iam = new IAM();

  if (policyName) {
    await iam.deleteRolePolicy({ RoleName: roleName, PolicyName: policyName }).promise();
  }

  await iam.deleteRole({ RoleName: roleName }).promise();
};
