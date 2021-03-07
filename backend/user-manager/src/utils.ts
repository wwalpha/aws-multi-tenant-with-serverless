import { CognitoIdentityServiceProvider, CognitoIdentity, IAM } from 'aws-sdk';
import { DynamodbHelper } from 'dynamodb-helper';
import winston from 'winston';
import { ADMIN_POLICY, COGNITO_PRINCIPALS, Environments, USER_POLICY } from './consts';
import { Tables, Token, User } from 'typings';
import { CredentialsOptions } from 'aws-sdk/lib/credentials';
import express from 'express';
import axios from 'axios';

const AWS_REGION = process.env.AWS_DEFAULT_REGION;

/**
 * provision cognito and admin user by system credentials
 *
 * @param request
 */
export const provisionAdminUserWithRoles = async (
  request: User.TenantAdminRegistRequest
): Promise<User.CognitoInfos> => {
  const provider = new CognitoIdentityServiceProvider();

  // create user pool
  const userPool = await createUserPool(provider, request.tenantId);
  // user pool id
  const userPoolId = userPool.Id as string;

  // create user pool client
  const userPoolClient = await createUserPoolClient(provider, userPool);
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
 * Provision user pool
 *
 * @param provider Cognito identiy service provider
 * @param tenantId tenant id
 */
const createUserPool = async (
  provider: CognitoIdentityServiceProvider,
  tenantId: string
): Promise<CognitoIdentityServiceProvider.UserPoolType> => {
  const result = await provider
    .createUserPool({
      PoolName: tenantId,
      AdminCreateUserConfig: {
        AllowAdminCreateUserOnly: true,
        UnusedAccountValidityDays: 90,
      },
      AliasAttributes: ['phone_number'],
      // AutoVerifiedAttributes: ['email', 'phone_number'],
      AutoVerifiedAttributes: ['email'],
      MfaConfiguration: 'OFF',
      Policies: {
        PasswordPolicy: {
          MinimumLength: 8,
          RequireLowercase: true,
          RequireNumbers: true,
          RequireSymbols: false,
          RequireUppercase: true,
        },
      },
      Schema: [
        {
          AttributeDataType: 'String',
          DeveloperOnlyAttribute: false,
          Mutable: false,
          Name: 'tenant_id',
          NumberAttributeConstraints: {
            MaxValue: '256',
            MinValue: '1',
          },
          Required: false,
          StringAttributeConstraints: {
            MaxLength: '256',
            MinLength: '1',
          },
        },
        {
          AttributeDataType: 'String',
          DeveloperOnlyAttribute: false,
          Mutable: true,
          Name: 'tier',
          NumberAttributeConstraints: {
            MaxValue: '256',
            MinValue: '1',
          },
          Required: false,
          StringAttributeConstraints: {
            MaxLength: '256',
            MinLength: '1',
          },
        },
        {
          Name: 'email',
          Required: true,
        },
        {
          AttributeDataType: 'String',
          DeveloperOnlyAttribute: false,
          Mutable: true,
          Name: 'company_name',
          NumberAttributeConstraints: {
            MaxValue: '256',
            MinValue: '1',
          },
          Required: false,
          StringAttributeConstraints: {
            MaxLength: '256',
            MinLength: '1',
          },
        },
        {
          AttributeDataType: 'String',
          DeveloperOnlyAttribute: false,
          Mutable: true,
          Name: 'role',
          NumberAttributeConstraints: {
            MaxValue: '256',
            MinValue: '1',
          },
          Required: false,
          StringAttributeConstraints: {
            MaxLength: '256',
            MinLength: '1',
          },
        },
        {
          AttributeDataType: 'String',
          DeveloperOnlyAttribute: false,
          Mutable: true,
          Name: 'account_name',
          NumberAttributeConstraints: {
            MaxValue: '256',
            MinValue: '1',
          },
          Required: false,
          StringAttributeConstraints: {
            MaxLength: '256',
            MinLength: '1',
          },
        },
      ],
    })
    .promise();

  const userPool = result.UserPool;

  if (!userPool) throw new Error('Create user pool failed.');

  return userPool;
};

/**
 * Provision user pool client
 *
 * @param provider Cognito identiy service provider
 * @param userPool Cognito user pool
 * @returns user pool client instance
 */
const createUserPoolClient = async (
  provider: CognitoIdentityServiceProvider,
  userPool: CognitoIdentityServiceProvider.UserPoolType
) => {
  // create user pool client
  const client = await provider
    .createUserPoolClient({
      UserPoolId: userPool.Id as string,
      ClientName: userPool.Name as string,
      GenerateSecret: true,
      RefreshTokenValidity: 0,
      ReadAttributes: [
        'email',
        'family_name',
        'given_name',
        'phone_number',
        'preferred_username',
        'custom:tier',
        'custom:tenant_id',
        'custom:company_name',
        'custom:account_name',
        'custom:role',
      ],
      WriteAttributes: [
        'email',
        'family_name',
        'given_name',
        'phone_number',
        'preferred_username',
        'custom:tier',
        'custom:role',
      ],
    })
    .promise();

  const userPoolClient = client.UserPoolClient;

  if (!userPoolClient) throw new Error('Create user pool client failed.');

  return userPoolClient;
};

/**
 * Provision identity pool
 *
 * @param userPoolId cognito user pool id
 * @param userPoolClientId cognito user pool client id
 * @param userPoolClientName cognito user pool client name
 */
const createIdentiyPool = async (userPoolId: string, userPoolClientId: string, userPoolClientName: string) => {
  const identity = new CognitoIdentity();

  const providerName = `cognito-idp.${AWS_REGION}.amazonaws.com/${userPoolId}`;
  // create identity pool
  const identityPool = await identity
    .createIdentityPool({
      IdentityPoolName: userPoolClientName as string,
      AllowUnauthenticatedIdentities: false,
      CognitoIdentityProviders: [
        {
          ClientId: userPoolClientId,
          ProviderName: providerName,
          ServerSideTokenCheck: true,
        },
      ],
    })
    .promise();

  return identityPool as CognitoIdentity.IdentityPool;
};

/**
 * set identity pool role rule
 *
 * @param userPoolId user pool id
 * @param userPoolClientId user pool client id
 * @param identityPoolId identity pool id
 * @param authRole auth role
 * @param adminRole admin role
 * @param userRole user rol
 */
const setIdentityPoolRoles = async (
  userPoolId: string,
  userPoolClientId: string,
  identityPoolId: string,
  authRole: IAM.Role,
  adminRole: IAM.Role,
  userRole: IAM.Role
) => {
  const identity = new CognitoIdentity();

  const providerName = `cognito-idp.${AWS_REGION}.amazonaws.com/${userPoolId}:${userPoolClientId}`;
  // set identity roles
  await identity
    .setIdentityPoolRoles({
      IdentityPoolId: identityPoolId,
      Roles: {
        authenticated: authRole.Arn,
      },
      RoleMappings: {
        [providerName]: {
          Type: 'Rules',
          AmbiguousRoleResolution: 'Deny',
          RulesConfiguration: {
            Rules: [
              {
                Claim: 'custom:role',
                MatchType: 'Equals',
                RoleARN: adminRole.Arn,
                Value: 'TENANT_ADMIN',
              },
              {
                Claim: 'custom:role',
                MatchType: 'Equals',
                RoleARN: userRole.Arn,
                Value: 'TENANT_USER',
              },
            ],
          },
        },
      },
    })
    .promise();
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

  const helper = new DynamodbHelper();
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
      PolicyName: 'inline',
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
      PolicyName: 'userPolicy',
      PolicyDocument: userPolicy,
    })
    .promise();

  return userRole.Role;
};

/**
 * Create a new user
 *
 * @param credentials credentials
 * @param userPoolId user pool id
 * @param user user attributes
 */
export const createCognitoUser = async (
  userPoolId: string,
  user: Tables.UserTableItem,
  credentials?: CredentialsOptions
) => {
  // init service provider
  const provider = new CognitoIdentityServiceProvider({
    credentials: credentials,
  });

  // create new user
  const result = await provider
    .adminCreateUser({
      UserPoolId: userPoolId,
      Username: user.userName,
      DesiredDeliveryMediums: ['EMAIL'],
      ForceAliasCreation: true,
      UserAttributes: [
        {
          Name: 'email',
          Value: user.email,
        },
        {
          Name: 'custom:tenant_id',
          Value: user.tenantId,
        },
        {
          Name: 'given_name',
          Value: user.firstName,
        },
        {
          Name: 'family_name',
          Value: user.lastName,
        },
        {
          Name: 'custom:role',
          Value: user.role,
        },
        {
          Name: 'custom:tier',
          Value: user.tier,
        },
      ],
    })
    .promise();

  const cognitoUser = result.User;

  if (!cognitoUser) throw new Error('Create new user failed.');

  return cognitoUser;
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
  credentials?: CredentialsOptions
) => {
  const helper = new DynamodbHelper({
    credentials: credentials,
  });

  if (isSystemContext) {
    const searchParams = {
      TableName: Environments.TABLE_NAME_USER,
      IndexName: 'gsiIdx',
      KeyConditionExpression: 'id = :id',
      ExpressionAttributeValues: {
        ':id': userId,
      },
    };

    const results = await helper.query(searchParams);

    // not found
    if (results.Count === 0) {
      throw undefined;
    }

    // user founded
    if (results.Items) {
      return results.Items[0];
    }
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

  return results?.Item;
};

/**
 * Create a new user using the supplied credentials/user
 *
 * @param credentials The creds used for the user creation
 * @param request the tenant admin regist request
 * @param cognito The cognito infomations
 */
export const createNewUser = async (
  request: User.TenantAdminRegistRequest,
  cognito: User.CognitoInfos,
  role: 'TENANT_ADMIN' | 'TENANT_USER',
  credentials?: CredentialsOptions
) => {
  const userItem: Tables.UserTableItem = {
    ...request,
    accountName: request.companyName,
    userPoolId: cognito.UserPoolId,
    clientId: cognito.ClientId,
    identityPoolId: cognito.IdentityPoolId,
    ownerName: request.companyName,
    email: request.userName,
    id: request.userName,
    role: role,
  };

  // create cognito user;
  const user = await createCognitoUser(cognito.UserPoolId, userItem, credentials);

  // set sub
  if (user.Attributes) {
    userItem.sub = user.Attributes[0].Value;
  }

  const helper = new DynamodbHelper({
    credentials: credentials,
  });

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
export const getCredentialsFromToken = async (req: express.Request): Promise<CredentialsOptions> => {
  const bearerToken = req.get('Authorization');

  if (!bearerToken) {
    throw new Error('Bearer token not found.');
  }

  // get token
  const token = bearerToken.split(' ')[1];

  // get credentials from user token
  const res = await axios.post<Token.UserTokenResponse>(`${Environments.SERVICE_ENDPOINT_TOKEN}/token/user`, {
    token,
  });

  return {
    accessKeyId: res.data.accessKeyId,
    secretAccessKey: res.data.secretAccessKey,
    sessionToken: res.data.sessionToken,
  };
};
