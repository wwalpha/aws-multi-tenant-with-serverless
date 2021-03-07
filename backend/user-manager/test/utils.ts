import { CognitoIdentity, CognitoIdentityServiceProvider, IAM } from 'aws-sdk';
import { DynamodbHelper } from 'dynamodb-helper';
import { Tables } from 'typings';
import { Environments } from '../src/consts';

export const initialize = async () => {
  const client = new DynamodbHelper();

  const users = require('./data/users.json');
  const tenants = require('./data/tenants.json');

  await client.bulk(Environments.TABLE_NAME_USER, users);
  await client.bulk(Environments.TABLE_NAME_TENANT, tenants);
};

export const clean = async (tenantId: string, userId: string) => {
  const provider = new CognitoIdentityServiceProvider();
  const identity = new CognitoIdentity();
  const client = new DynamodbHelper();

  // delete user pool
  const userPool = (await provider.listUserPools({ MaxResults: 60 }).promise()).UserPools?.find(
    (item) => item.Name === tenantId
  );
  // @ts-ignore
  await provider.deleteUserPool({ UserPoolId: userPool?.Id }).promise();

  const identityPool = (await identity.listIdentityPools({ MaxResults: 60 }).promise()).IdentityPools?.find(
    (item) => item.IdentityPoolName === tenantId
  );

  // @ts-ignore
  await identity.deleteIdentityPool({ IdentityPoolId: identityPool?.IdentityPoolId }).promise();

  // delete tenant data
  await client.delete({
    TableName: Environments.TABLE_NAME_TENANT,
    Key: {
      id: tenantId,
    } as Tables.TenantKey,
  });

  await client.delete({
    TableName: Environments.TABLE_NAME_USER,
    Key: {
      tenantId: tenantId,
      id: userId,
    } as Tables.UserKey,
  });

  await deleteRole(`SaaS_${tenantId}_AdminRole`, 'AdminPolicy');
  await deleteRole(`SaaS_${tenantId}_UserRole`, 'UserPolicy');
  await deleteRole(`SaaS_${tenantId}_AuthRole`);
};

const deleteRole = async (roleName: string, policy?: string) => {
  const iam = new IAM();

  if (policy) {
    await iam.deleteRolePolicy({ RoleName: roleName, PolicyName: policy }).promise();
  }

  await iam.deleteRole({ RoleName: roleName }).promise();
};

initialize();
