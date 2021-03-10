import AWS, { Credentials, IAM } from 'aws-sdk';
import express from 'express';
import axios from 'axios';
import winston from 'winston';
import { DynamodbHelper } from 'dynamodb-helper';
import { ADMIN_POLICY, COGNITO_PRINCIPALS, Environments, USER_POLICY } from './consts';
import {
  createCognitoUser,
  createIdentiyPool,
  createUserPool,
  createUserPoolClient,
  setIdentityPoolRoles,
} from './cognito';
import { Tables, Token, User } from 'typings';

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

/**
 * provision cognito and admin user by system credentials
 *
 * @param request
 */
export const provisionAdminUserWithRoles = async (
  request: User.CreateTenantAdminRequest
): Promise<User.CognitoInfos> => {
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

  // auth role
  const authRole = await createAuthRole(request.tenantId, identityPool.IdentityPoolId);
  // admin user role
  const adminRole = await createAdminRole(request.tenantId, identityPool.IdentityPoolId, userPool.Arn);
  // normal user role
  const userRole = await createUserRole(request.tenantId, identityPool.IdentityPoolId, userPool.Arn);

  // create identity pool
  await setIdentityPoolRoles(userPoolId, clientId, identityPoolId, authRole, adminRole, userRole);

  return {
    UserPoolId: userPool.Id as string,
    ClientId: userPoolClient.ClientId as string,
    IdentityPoolId: identityPool.IdentityPoolId,
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
const createAdminRole = async (tenantId: string, identityPoolId: string, userpoolArn: string = '') => {
  const principals = COGNITO_PRINCIPALS(identityPoolId);

  const helper = new DynamodbHelper({ options: { endpoint: Environments.AWS_ENDPOINT_URL } });
  const client = helper.getClient();

  const user = await client.describeTable({ TableName: Environments.TABLE_NAME_USER }).promise();
  const order = await client.describeTable({ TableName: Environments.TABLE_NAME_ORDER }).promise();
  const product = await client.describeTable({ TableName: Environments.TABLE_NAME_PRODUCT }).promise();

  const adminPolicy = ADMIN_POLICY(
    tenantId,
    userpoolArn,
    user.Table?.TableArn,
    order.Table?.TableArn,
    product.Table?.TableArn
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
 * Create user role
 *
 * @param tenantId tenant id
 * @param identityPoolId identity pool id
 * @param userpoolArn userpool arn
 */
const createUserRole = async (tenantId: string, identityPoolId: string, userpoolArn: string = '') => {
  const principals = COGNITO_PRINCIPALS(identityPoolId);

  const helper = new DynamodbHelper();
  const client = helper.getClient();

  const user = await client.describeTable({ TableName: Environments.TABLE_NAME_USER }).promise();
  const order = await client.describeTable({ TableName: Environments.TABLE_NAME_ORDER }).promise();
  const product = await client.describeTable({ TableName: Environments.TABLE_NAME_PRODUCT }).promise();

  const userPolicy = USER_POLICY(
    tenantId,
    userpoolArn,
    user.Table?.TableArn,
    order.Table?.TableArn,
    product.Table?.TableArn
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
    tenant_id: tenantId,
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
