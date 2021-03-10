import { CognitoIdentity, CognitoIdentityServiceProvider, Credentials, IAM } from 'aws-sdk';
import { defaultTo } from 'lodash';
import { Tables, User } from 'typings';
import { Environments } from './consts';
import winston from 'winston';

/** logger */
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: {
    service: 'user-service',
  },
  transports: [new winston.transports.Console({ level: 'debug' })],
});
/** system provider */
const provider = new CognitoIdentityServiceProvider({ region: Environments.AWS_DEFAULT_REGION });
/** system identity */
const identity = new CognitoIdentity({ region: Environments.AWS_DEFAULT_REGION });

/**
 * Provision user pool
 *
 * @param tenantId tenant id
 */
export const createUserPool = async (tenantId: string): Promise<CognitoIdentityServiceProvider.UserPoolType> => {
  logger.debug('Provision cognito user pool.');

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

  logger.debug(`Cognito user pool created. ${userPool.Id}`);

  return userPool;
};

/**
 * Provision user pool client
 *
 * @param provider Cognito identiy service provider
 * @param userPool Cognito user pool
 * @returns user pool client instance
 */
export const createUserPoolClient = async (userPool: CognitoIdentityServiceProvider.UserPoolType) => {
  logger.debug('Provision cognito user pool client.');

  // create user pool client
  const client = await provider
    .createUserPoolClient({
      UserPoolId: userPool.Id as string,
      ClientName: userPool.Name as string,
      GenerateSecret: false,
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
      ExplicitAuthFlows: [
        'ALLOW_ADMIN_USER_PASSWORD_AUTH',
        'ALLOW_CUSTOM_AUTH',
        'ALLOW_REFRESH_TOKEN_AUTH',
        'ALLOW_USER_SRP_AUTH',
      ],
    })
    .promise();

  const userPoolClient = client.UserPoolClient;

  if (!userPoolClient) throw new Error('Create user pool client failed.');

  logger.debug(`Cognito user pool client created. ${userPoolClient.ClientId}`);

  return userPoolClient;
};

/**
 * Provision identity pool
 *
 * @param userPoolId cognito user pool id
 * @param userPoolClientId cognito user pool client id
 * @param userPoolClientName cognito user pool client name
 */
export const createIdentiyPool = async (userPoolId: string, userPoolClientId: string, userPoolClientName: string) => {
  logger.debug('Provision cognito identity pool...');

  const providerName = `cognito-idp.${Environments.AWS_DEFAULT_REGION}.amazonaws.com/${userPoolId}`;
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

  logger.debug(`Cognito identity pool created. ${identityPool.IdentityPoolId}`);

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
export const setIdentityPoolRoles = async (
  userPoolId: string,
  userPoolClientId: string,
  identityPoolId: string,
  authRole: IAM.Role,
  adminRole: IAM.Role,
  userRole: IAM.Role
) => {
  const providerName = `cognito-idp.${Environments.AWS_DEFAULT_REGION}.amazonaws.com/${userPoolId}:${userPoolClientId}`;
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
 * Create a new user
 *
 * @param credentials credentials
 * @param userPoolId user pool id
 * @param user user attributes
 *
 */
export const createCognitoUser = async (userPoolId: string, user: Tables.UserItem, credentials?: Credentials) => {
  // init service provider
  const provider = new CognitoIdentityServiceProvider({
    credentials: credentials,
  });

  // create new user
  const result = await provider
    .adminCreateUser({
      UserPoolId: userPoolId,
      Username: user.email,
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
 * Get user details from cognito user pool
 *
 * @param userPoolId user pool id
 * @param userName user name
 * @param credentials credentials
 */
export const getCognitoUser = async (
  userPoolId: string,
  userName: string,
  credentials: Credentials
): Promise<User.CognitoUser> => {
  const provider = new CognitoIdentityServiceProvider({ credentials });

  // get user details
  const result = await provider
    .adminGetUser({
      UserPoolId: userPoolId,
      Username: userName,
    })
    .promise();

  return {
    userName: result.Username,
    enabled: defaultTo(result.Enabled, false),
    createDate: result.UserCreateDate,
    status: defaultTo(result.UserStatus, ''),
    firstName: defaultTo(result.UserAttributes?.find((item) => item.Name === 'given_name')?.Value, ''),
    lastName: defaultTo(result.UserAttributes?.find((item) => item.Name === 'family_name')?.Value, ''),
    role: defaultTo(result.UserAttributes?.find((item) => item.Name === 'custom:role')?.Value, ''),
    tier: defaultTo(result.UserAttributes?.find((item) => item.Name === 'custom:tier')?.Value, ''),
    email: defaultTo(result.UserAttributes?.find((item) => item.Name === 'custom:email')?.Value, ''),
  };
};

/**
 * Update cognito user details
 * @param userPoolId user pool id
 * @param details
 * @param credentials
 */
export const updateCognitoUser = async (userPoolId: string, details: any, credentials: Credentials) => {
  logger.debug(`Updating cognito user: ${details.userName}`);

  const provider = new CognitoIdentityServiceProvider({ credentials });

  // user details update
  await provider
    .adminUpdateUserAttributes({
      UserPoolId: userPoolId,
      Username: details.userName,
      UserAttributes: [
        {
          Name: 'custom:role',
          Value: details.role,
        },
        {
          Name: 'given_name',
          Value: details.firstName,
        },
        {
          Name: 'family_name',
          Value: details.lastName,
        },
      ],
    })
    .promise();

  logger.debug(`Cognito user updated: ${details.userName}`);
};

/**
 * delete user in cognito user pool
 *
 * @param userPoolId user pool id
 * @param userName user name
 * @param credentials credentials
 *
 */
export const deleteCognitoUser = async (userPoolId: string, userName: string, credentials: Credentials) => {
  logger.debug(`Deleting cognito user: ${userName}`);

  const provider = new CognitoIdentityServiceProvider({ credentials });

  await provider
    .adminDeleteUser({
      UserPoolId: userPoolId,
      Username: userName,
    })
    .promise();

  logger.debug(`Cognito user deleted: ${userName}`);
};

/**
 * Get all user details in cognito user pool
 *
 * @param userPoolId user pool id
 * @param credentials credentials
 * @returns user details
 */
export const listCognitoUsers = async (userPoolId: string, credentials: Credentials): Promise<User.CognitoUser[]> => {
  // identity provider
  const provider = new CognitoIdentityServiceProvider({ credentials });
  // all users
  const results = await provider.listUsers({ UserPoolId: userPoolId }).promise();

  // create response
  let users = results.Users?.map<User.CognitoUser>((u) => ({
    userName: defaultTo(u.Username, ''),
    enabled: defaultTo(u.Enabled, false),
    status: defaultTo(u.UserStatus, 'UNKNOWN'),
    createDate: u.UserCreateDate,
    firstName: defaultTo(u.Attributes?.find((item) => item.Name === 'given_name')?.Value, ''),
    lastName: defaultTo(u.Attributes?.find((item) => item.Name === 'family_name')?.Value, ''),
    role: defaultTo(u.Attributes?.find((item) => item.Name === 'custom:role')?.Value, ''),
    tier: defaultTo(u.Attributes?.find((item) => item.Name === 'custom:tier')?.Value, ''),
    email: defaultTo(u.Attributes?.find((item) => item.Name === 'custom:email')?.Value, ''),
  }));

  return (users ??= []);
};
