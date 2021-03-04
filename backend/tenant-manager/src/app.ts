import express from 'express';
import winston from 'winston';
import { DynamodbHelper } from 'dynamodb-helper';
import { Environments, getCredentialsFromToken } from './utils';
import { Tenant, Tables } from 'typings';

winston.add(new winston.transports.Console({ level: 'debug' }));

/** catch undefined errors */
export const common = async (req: express.Request, res: express.Response, app: any) => {
  winston.info(`request: ${JSON.stringify(req.body)}`);

  try {
    const results = await app(req, res);

    res.status(200).send(results);
  } catch (err) {
    winston.error(err);

    res.status(400).send(err);
  }
};

// health check
export const healthCheck = async () => ({ service: 'Tenant Manager', isAlive: true });

/** create a tenant */
export const registTenant = async (req: express.Request): Promise<Tenant.RegistTenantResponse> => {
  const tenantId = req.params.id;
  const tenant = req.body as Tenant.RegistTenantRequest;

  winston.debug('Creating Tenant: ' + tenantId);

  const client = new DynamodbHelper();

  const item: Tables.TenantItem = {
    // @ts-ignore
    id: tenantId,
    status: 'Active',
    ...tenant,
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

  const client = new DynamodbHelper();
  const key: Tables.TenantKey = {
    id: req.params.id,
  };

  const tenant = await client.get({
    TableName: Environments.TABLE_NAME_TENANT,
    Key: key,
  });

  if (!tenant) {
    throw new Error('Can not found tenant.');
  }

  return (tenant?.Item as unknown) as Tenant.GetTenantResponse;
};

/** update tenant */
export const updateTanant = async (req: express.Request): Promise<Tenant.UpdateTenantResponse> => {
  winston.debug('Updating tenant: ' + req.body.id);

  // TODO
  const credentials = getCredentialsFromToken(req);

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
  const credentials = getCredentialsFromToken(req);
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
