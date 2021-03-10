import express from 'express';
import { defaultTo } from 'lodash';
import { v4 } from 'uuid';
import { TenantReg } from 'typings';
import { getLogger, registTenantAdmin, saveTenant, tenantExists } from './utils';

const logger = getLogger();

/** catch undefined errors */
export const common = async (req: express.Request, res: express.Response, app: any) => {
  // logger.info(`request: ${JSON.stringify(req.body)}`);
  logger.info('request', req.body);

  try {
    const results = await app(req, res);

    logger.info('response', results);

    res.status(200).send(results);
  } catch (err) {
    logger.error('unhandled error', err);

    const message = defaultTo(err.message, err.response?.data);

    res.status(400).send(message);
  }
};

/** health check */
export const healthCheck = (_: express.Request, res: express.Response) => {
  res.status(200).send({ service: 'Tenant Registration', isAlive: true });
};

/** regist tenant */
export const registTenant = async (req: express.Request<any, any, TenantReg.RegistTenantRequest>) => {
  const request = req.body;

  // Generate the tenant id
  const tenantId = `TENANT${v4()}`.split('-').join('');
  logger.debug('Creating Tenant ID: ' + tenantId);

  // if the tenant doesn't exist, create one
  if (await tenantExists(request.email)) {
    throw new Error('Registering new tenant failed.');
  }

  // regist tenant admin
  const admin = await registTenantAdmin(tenantId, request);

  // tenant 情報登録
  await saveTenant(request, admin);
};
