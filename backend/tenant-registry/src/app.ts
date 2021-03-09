import express from 'express';
import winston from 'winston';
import { v4 } from 'uuid';
import { TenantReg } from 'typings';
import { registTenantAdmin, tenantExists } from './utils';

// Configure Logging
winston.add(new winston.transports.Console({ level: 'debug' }));

/** health check */
export const healthCheck = (_: express.Request, res: express.Response) => {
  res.status(200).send({ service: 'Tenant Registration', isAlive: true });
};

export const registTenant = async (req: express.Request) => {
  const request = req.body as TenantReg.RegistTenantRequest;

  // Generate the tenant id
  const tenantId = `TENANT${v4()}`.split('-').join('');
  winston.debug('Creating Tenant ID: ' + tenantId);

  // if the tenant doesn't exist, create one
  if (await tenantExists(tenantId)) {
    throw new Error('Registering new tenant failed.');
  }

  // regist tenant admin
  const admin = await registTenantAdmin(tenantId, request);

  // const item: TenantItem = {
  //   accountName: request.accountName,
  //   ownerName: request.ownerName,
  //   companyName: request.companyName,
  //   userName: request.userName,
  //   email: request.email,
  //   tier: request.tier,
  //   // trustRole: string;
  //   // userPoolId: string;
  //   // identityPoolId: string;
  //   // sysAdminPolicy: string;
  //   // sysAdminRole: string;
  //   // sysSupportPolicy: string;
  //   // sysSupportRole: string;
  // };

  // tenant 情報登録
  await saveTenant(item);
};
