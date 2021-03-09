import express from 'express';
import winston from 'winston';
import { v4 } from 'uuid';
import { TenantReg } from 'typings';
import { registTenantAdmin, saveTenant, tenantExists } from './utils';

// Configure Logging
winston.add(new winston.transports.Console({ level: 'debug' }));

/** health check */
export const healthCheck = (_: express.Request, res: express.Response) => {
  res.status(200).send({ service: 'Tenant Registration', isAlive: true });
};

/** regist tenant */
export const registTenant = async (req: express.Request<any, any, TenantReg.RegistTenantRequest>) => {
  const request = req.body;

  // Generate the tenant id
  const tenantId = `TENANT${v4()}`.split('-').join('');
  winston.debug('Creating Tenant ID: ' + tenantId);

  // if the tenant doesn't exist, create one
  if (await tenantExists(request.email)) {
    throw new Error('Registering new tenant failed.');
  }

  // regist tenant admin
  const admin = await registTenantAdmin(tenantId, request);

  console.log(admin);
  // tenant 情報登録
  await saveTenant(request, admin);
};
