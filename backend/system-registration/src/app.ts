import express from 'express';
import { v4 } from 'uuid';
import { createSystemAdmin, getLogger, saveTenant, tenantExists } from './utils';
import { SystemReg } from 'typings';

const logger = getLogger();

/** health check */
export const healthCheck = (_: express.Request, res: express.Response) => {
  res.status(200).send({ service: 'Tenant Registration', isAlive: true });
};

/** regist system tenant */
export const registSystemTenant = async (
  req: express.Request<any, any, SystemReg.RegistSystemTenantRequest>
): Promise<SystemReg.RegistSystemTenantResponse> => {
  const request = req.body;

  // Generate the tenant id
  const tenantId = `SYSTEM${v4()}`.split('-').join('');
  logger.debug('Creating Tenant ID: ' + tenantId);

  // if the tenant doesn't exist, create one
  if (await tenantExists(request.email)) {
    throw new Error('Registering new tenant failed.');
  }

  // regist tenant admin
  const admin = await createSystemAdmin(tenantId, request);

  // tenant 情報登録
  await saveTenant(admin);

  return {
    status: 'success',
  };
};

// export const deleteSystemAdmin = async (req: express.Request<any, any, SystemReg.RegistTenantRequest>) => {};
