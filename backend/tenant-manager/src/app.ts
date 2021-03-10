import express from 'express';
import { DynamodbHelper } from 'dynamodb-helper';
import { getCredentialsFromToken, getLogger } from './utils';
import { Tenant, Tables } from 'typings';
import { Environments } from './consts';

const logger = getLogger();

/** catch undefined errors */
export const common = async (req: express.Request, res: express.Response, app: any) => {
  logger.info('request', req.body);

  try {
    const results = await app(req, res);

    logger.info('response', results);

    res.status(200).send(results);
  } catch (err) {
    logger.error('unhandle error', err);

    const message = defaultTo(err.message, err.response?.data);

    res.status(400).send(message);
  }
};

// health check
export const healthCheck = async () => ({ service: 'Tenant Manager', isAlive: true });

/** create a tenant */
export const createTenant = async (
  req: express.Request<any, any, Tenant.CreateTenantRequest>
): Promise<Tenant.CreateTenantResponse> => {
  const request = req.body;

  logger.debug(`Creating Tenant: ${request.id}`);

  const client = new DynamodbHelper();
  const item: Tables.TenantItem = {
    status: 'Active',
    ...request,
  };

  // add tenant info
  await client.put({
    TableName: Environments.TABLE_NAME_TENANT,
    Item: item,
  });

  logger.debug(`Tenant ${request.id} created`);

  return {
    status: 'success',
  };
};

/** get tenant attributes */
export const getTenant = async (req: express.Request): Promise<Tenant.GetTenantResponse> => {
  logger.debug('Fetching tenant: ' + req.params.id);

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
    companyName: tenant.Item.companyName,
    ownerName: tenant.Item.ownerName,
    email: tenant.Item.ownerName,
    tier: tenant.Item.tier,
    status: tenant.Item.status,
    userPoolId: tenant.Item.userPoolId,
    clientId: tenant.Item.clientId,
    identityPoolId: tenant.Item.identityPoolId,
  };
};

/** update tenant */
export const updateTanant = async (
  req: express.Request<any, any, Tenant.UpdateTenantRequest>
): Promise<Tenant.UpdateTenantResponse> => {
  logger.debug('Updating tenant: ' + req.params.id);

  // get
  const credentials = await getCredentialsFromToken(req);

  const client = new DynamodbHelper({
    options: { credentials },
  });

  // tenant update
  const tenant = await client.update({
    TableName: Environments.TABLE_NAME_TENANT,
    Key: {
      id: req.params.id,
    } as Tables.TenantKey,
    UpdateExpression: 'set companyName=:companyName, tier=:tier, ',
    ExpressionAttributeValues: {
      ':companyName': req.body.companyName,
      ':tier': req.body.tier,
    },
    ReturnValues: 'UPDATED_NEW',
  });

  // error check
  if (!tenant.Attributes) {
    throw new Error('Update tenant failed.');
  }

  logger.debug('Tenant updated');

  // return updated item
  return tenant.Attributes as Tables.TenantItem;
};

/** delete tenant */
export const deleteTenant = async (req: express.Request): Promise<Tenant.DeleteTenantResponse> => {
  logger.debug('Deleting Tenant: ' + req.params.id);

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
    ownerName: item.ownerName,
    email: item.ownerName,
    companyName: item.companyName,
    tier: item.tier,
    status: item.status,
    userPoolId: item.userPoolId,
    clientId: item.clientId,
    identityPoolId: item.identityPoolId,
  }));

  // not found
  if (!response) {
    throw new Error('Tenant table scan failed.');
  }

  return response;
};
function defaultTo(message: any, data: any) {
  throw new Error('Function not implemented.');
}
