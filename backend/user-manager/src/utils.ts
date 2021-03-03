import { CognitoIdentityServiceProvider, CognitoIdentity, IAM, Config } from 'aws-sdk';
import * as fs from 'fs';
import { DynamodbHelper } from 'dynamodb-helper';
import winston from 'winston';
import { ADMIN_POLICY, COGNITO_PRINCIPALS, USER_POLICY } from './consts';
import { Configs, Tables, User } from 'typings';

const AWS_REGION = process.env.AWS_DEFAULT_REGION;
const CONFIGS: Configs = JSON.parse(fs.readFileSync('./datas/configs.json').toString());

export const provisionAdminUserWithRoles = async (
  request: User.TenantAdminRegistRequest,
  credentials: User.Credentials
): Promise<User.CognitoInfos> => {
  const provider = new CognitoIdentityServiceProvider({
    credentials: credentials.claim,
  });

  // create user pool
  const userPool = await createUserPool(provider, request.tenantId);
  // create user pool client
  const userPoolClient = await createUserPoolClient(provider, userPool);
  // create identity pool
  const identityPool = await createIdentiyPool(userPool.Id, userPoolClient.ClientId, userPoolClient.ClientName);

  // admin user role
  await createAdminRole(request.tenantId, identityPool.IdentityPoolId, userPool.Arn);
  // normal user role
  await createUserRole(request.tenantId, identityPool.IdentityPoolId, userPool.Arn);

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
const createIdentiyPool = async (userPoolId?: string, userPoolClientId?: string, userPoolClientName?: string) => {
  const identity = new CognitoIdentity();

  // create identity pool
  const identityPool = await identity
    .createIdentityPool({
      IdentityPoolName: userPoolClientName as string,
      AllowUnauthenticatedIdentities: false,
      CognitoIdentityProviders: [
        {
          ClientId: userPoolClientId,
          ProviderName: `cognito-idp.${AWS_REGION}.amazonaws.com/${userPoolId}`,
          ServerSideTokenCheck: true,
        },
      ],
    })
    .promise();

  return identityPool as CognitoIdentity.IdentityPool;
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
  const adminPolicy = ADMIN_POLICY(
    tenantId,
    CONFIGS.Tables.User.Arn,
    CONFIGS.Tables.Order.Arn,
    CONFIGS.Tables.Product.Arn,
    userpoolArn
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
  const userPolicy = USER_POLICY(
    tenantId,
    CONFIGS.Tables.User.Arn,
    CONFIGS.Tables.Order.Arn,
    CONFIGS.Tables.Product.Arn,
    userpoolArn
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
};

/**
 * Create a new user
 *
 * @param credentials credentials
 * @param userPoolId user pool id
 * @param user user attributes
 */
export const createCognitoUser = async (
  credentials: User.Credentials,
  userPoolId: string,
  user: Tables.UserTableItem
) => {
  // init service provider
  const provider = new CognitoIdentityServiceProvider({
    credentials: credentials.claim,
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
 * @param credentials The credentials used ben looking up the user
 * @param userId The id of the user being looked up
 * @param tenantId The id of the tenant (if this is not system context)
 * @param isSystemContext Is this being called in the context of a system user (registration, system user provisioning)
 */
export const lookupUserPoolData = async (
  credentials: User.Credentials,
  userId: string,
  isSystemContext: boolean,
  tenantId?: string
) => {
  const helper = new DynamodbHelper({
    credentials: credentials.claim,
  });

  if (isSystemContext) {
    const searchParams = {
      TableName: 'userSchema.TableName',
      IndexName: 'userSchema.GlobalSecondaryIndexes[0].IndexName',
      KeyConditionExpression: 'id = :id',
      ExpressionAttributeValues: {
        ':id': userId,
      },
    };

    const results = await helper.query(searchParams);

    if (results.Count === 0) {
      throw new Error('No user found: ' + userId);
    }

    // return users
    if (results.Items) {
      return results.Items[0];
    }
  } else {
    const searchParams = {
      id: userId,
      tenant_id: tenantId,
    };

    // get the item from the database
    const results = await helper.get({
      TableName: 'userSchema.TableName',
      Key: searchParams,
    });

    return results?.Item;
  }
};

export const getSystemCredentials = () =>
  new Promise<User.Credentials>((resolve, reject) => {
    const config = new Config({
      region: AWS_REGION,
    });

    config.getCredentials((err, credentials) => {
      if (err) {
        winston.debug('Unable to Obtain Credentials');

        reject(err);
        return;
      }

      // error check
      if (!credentials) {
        reject(new Error('Unable to Obtain Credentials'));
        return;
      }

      resolve({
        claim: {
          sessionToken: credentials.sessionToken,
          accessKeyId: credentials.accessKeyId,
          secretAccessKey: credentials.secretAccessKey,
        },
      });
    });
  });

/**
 * Create a new user using the supplied credentials/user
 *
 * @param credentials The creds used for the user creation
 * @param request the tenant admin regist request
 * @param cognito The cognito infomations
 */
export const createNewUser = async (
  credentials: User.Credentials,
  request: User.TenantAdminRegistRequest,
  cognito: User.CognitoInfos,
  role: 'TENANT_ADMIN' | 'TENANT_USER'
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
  const user = await createCognitoUser(credentials, cognito.UserPoolId, userItem);

  // set sub
  if (user.Attributes) {
    userItem.sub = user.Attributes[0].Value;
  }

  const helper = new DynamodbHelper({
    credentials: credentials.claim,
  });

  // add user
  await helper.put({
    TableName: CONFIGS.Tables.User.Name,
    Item: userItem,
  });

  return userItem;
};
