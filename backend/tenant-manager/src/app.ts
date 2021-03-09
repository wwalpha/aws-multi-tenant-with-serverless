import express, { request } from 'express';
import winston from 'winston';
import { DynamodbHelper } from 'dynamodb-helper';
import { getCredentialsFromToken } from './utils';
import { Tenant, Tables } from 'typings';
import { Environments } from './consts';

winston.add(new winston.transports.Console({ level: 'debug' }));

/** catch undefined errors */
export const common = async (req: express.Request, res: express.Response, app: any) => {
  winston.info(`request: ${JSON.stringify(req.body)}`);

  try {
    const results = await app(req, res);

    res.status(200).send(results);
  } catch (err) {
    winston.error(err);

    res.status(400).send(err.message);
  }
};

// health check
export const healthCheck = async () => ({ service: 'Tenant Manager', isAlive: true });

/** create a tenant */
export const registTenant = async (
  req: express.Request<any, any, Tenant.RegistTenantRequest>
): Promise<Tenant.RegistTenantResponse> => {
  const tenantId = req.params.id;
  const request = req.body;

  winston.debug('Creating Tenant: ' + tenantId);

  const client = new DynamodbHelper();

  const item: Tables.TenantItem = {
    // @ts-ignore
    id: tenantId,
    status: 'Active',
    ...request,
  };

  // add tenant info
  await client.put({
    TableName: Environments.TABLE_NAME_TENANT,
    Item: item,
  });

  winston.debug(`Tenant ${tenantId} created`);

  return {
    status: 'success',
  };
};

/** get tenant attributes */
export const getTenant = async (req: express.Request): Promise<Tenant.GetTenantResponse> => {
  winston.debug('Fetching tenant: ' + req.params.id);

  // get credentials from token
  const credentials = await getCredentialsFromToken(req);

  const client = new DynamodbHelper({ credentials });
  const key: Tables.TenantKey = {
    id: req.params.id,
  };

  const tenant = await client.get<Tables.TenantItem>({
    TableName: Environments.TABLE_NAME_TENANT,
    Key: key,
  });

  if (!tenant || !tenant.Item) {
    throw new Error('Can not found tenant.');
  }

  return {
    accountName: tenant.Item.accountName,
    companyName: tenant.Item.companyName,
    ownerName: tenant.Item.ownerName,
    userName: tenant.Item.userName,
    email: tenant.Item.email,
    tier: tenant.Item.tier,
    status: tenant.Item.status,
    userPoolId: tenant.Item.userPoolId,
    identityPoolId: tenant.Item.identityPoolId,
  };
};

/** update tenant */
export const updateTanant = async (req: express.Request): Promise<Tenant.UpdateTenantResponse> => {
  winston.debug('Updating tenant: ' + req.body.id);

  const credentials = await getCredentialsFromToken(req);

  const client = new DynamodbHelper({
    options: { credentials },
  });

  const keyParams = {
    id: req.body.id,
  };

  // tenant update
  const tenant = await client.update({
    TableName: Environments.TABLE_NAME_TENANT,
    Key: keyParams,
    UpdateExpression:
      'set ' +
      'companyName=:companyName, ' +
      'accountName=:accountName, ' +
      'ownerName=:ownerName, ' +
      'tier=:tier, ' +
      '#status=:status',
    ExpressionAttributeNames: {
      '#status': 'status',
    },
    ExpressionAttributeValues: {
      ':companyName': req.body.companyName,
      ':accountName': req.body.accountName,
      ':ownerName': req.body.ownerName,
      ':tier': req.body.tier,
      ':status': req.body.status,
    },
    ReturnValues: 'UPDATED_NEW',
  });

  // error check
  if (!tenant.Attributes) {
    throw new Error('Update tenant failed.');
  }

  winston.debug('Tenant ' + req.body.title + ' updated');

  // return updated item
  return tenant.Attributes as Tables.TenantItem;
};

/** delete tenant */
export const deleteTenant = async (req: express.Request): Promise<Tenant.DeleteTenantResponse> => {
  winston.debug('Deleting Tenant: ' + req.params.id);

  // get credentials from token
  const credentials = await getCredentialsFromToken(req);
  // init cilent
  const helper = new DynamodbHelper({ options: { credentials } });

  // delete tenant
  await helper.delete({
    TableName: Environments.TABLE_NAME_TENANT,
    Key: {
      id: req.params.id,
    },
  });

  // delete success
  return { status: 'success' };
};

/** get all tenants details */
export const getAllTenants = async (
  req: express.Request<any, any, Tenant.GetAllTenantRequest>
): Promise<Tenant.GetAllTenantResponse> => {
  const credentials = await getCredentialsFromToken(req);

  const client = new DynamodbHelper({
    credentials,
  });

  const results = await client.scan<Tables.TenantItem>({
    TableName: Environments.TABLE_NAME_TENANT,
    ProjectionExpression: 'id',
  });

  const response = results?.Items?.map<Tenant.GetTenantResponse>((item) => ({
    accountName: item.accountName,
    companyName: item.companyName,
    ownerName: item.ownerName,
    userName: item.userName,
    email: item.email,
    tier: item.tier,
    status: item.status,
    userPoolId: item.userPoolId,
    identityPoolId: item.identityPoolId,
  }));

  // not found
  if (!response) {
    throw new Error('Tenant table scan failed.');
  }

  return response;
};
