import express from 'express';
import winston from 'winston';
import { v4 } from 'uuid';
import { RegistTenantRequest, TenantItem } from 'typings/types';
import { registTenantAdmin, tenantExists } from './utils';

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

// Configure Logging
winston.add(new winston.transports.Console({ level: 'debug' }));

export const registTenant = async (req: express.Request, res: express.Response) => {
  const request = req.body as RegistTenantRequest;

  // Generate the tenant id
  const tenantId = `TENANT${v4()}`.split('-').join('');
  winston.debug('Creating Tenant ID: ' + tenantId);

  // if the tenant doesn't exist, create one
  if (await tenantExists(tenantId)) {
    res.status(400).send('Error registering new tenant');
    return;
  }

  // regist tenant admin
  const admin = await registTenantAdmin(request);

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

  // // tenant 情報登録
  // await saveTenant(item);
};

/** health check */
export const healthCheck = (_: express.Request, res: express.Response) => {
  res.status(200).send({ service: 'Tenant Registration', isAlive: true });
};

export const Environments = {
  TABLE_NAME_TENANT: process.env.TABLE_NAME_TENANT as string,
  TABLE_NAME_USER: process.env.TABLE_NAME_USER as string,
  TABLE_NAME_PRODUCT: process.env.TABLE_NAME_PRODUCT as string,
  TABLE_NAME_ORDER: process.env.TABLE_NAME_ORDER as string,
  SERVICE_ENDPOINT_TENANT: `http://${process.env.SERVICE_ENDPOINT_TENANT}`,
  SERVICE_ENDPOINT_USER: `http://${process.env.SERVICE_ENDPOINT_USER}`,
  SERVICE_ENDPOINT_AUTH: `http://${process.env.SERVICE_ENDPOINT_AUTH}`,
  SERVICE_ENDPOINT_TOKEN: `http://${process.env.SERVICE_ENDPOINT_TOKEN}`,
};
