import axios from 'axios';
import express from 'express';
import winston from 'winston';
import { Tenant, TenantReg, User } from 'typings';
import { Endpoints } from './consts';

// Init the winston log level
winston.add(new winston.transports.Console({ level: 'debug' }));

/** catch undefined errors */
export const common = async (req: express.Request, res: express.Response, app: any) => {
  winston.info(`request: ${JSON.stringify(req.body)}`);

  try {
    const results = await app(req, res);

    winston.info('response', results);

    res.status(200).send(results);
  } catch (err) {
    winston.error(err);

    res.status(400).send(err.message);
  }
};

/** check tenant exist */
export const tenantExists = async (userName: string): Promise<boolean> => {
  const res = await axios.get<User.LookupUserResponse>(Endpoints.LOOKUP_USER(userName));

  return res.data.isExist;
};

/** create tenant admin user */
export const registTenantAdmin = async (
  tenantId: string,
  request: TenantReg.RegistTenantRequest
): Promise<User.TenantAdminRegistResponse> => {
  // init the request with tenant data
  const tenantAdmin: User.TenantAdminRegistRequest = {
    tenantId: tenantId,
    companyName: request.companyName,
    userName: request.email,
    firstName: request.firstName,
    lastName: request.lastName,
    tier: request.tier,
  };

  // regist tenant admin
  const res = await axios.post<User.TenantAdminRegistResponse>(Endpoints.GET_TENANT(tenantId), tenantAdmin);

  if (res.status !== 200) {
    throw new Error(`Tenant admin create failed. ${res.data}`);
  }

  return res.data;
};

/** save tenant informations */
export const saveTenant = async (request: TenantReg.RegistTenantRequest, item: User.TenantAdminRegistResponse) => {
  const tenant: Tenant.RegistTenantRequest = {
    ownerName: item.id,
    email: item.email,
    companyName: request.companyName,
    tier: request.tier,
    userPoolId: item.userPoolId,
    identityPoolId: item.identityPoolId,
    clientId: item.clientId,
  };

  // create a tenant
  await axios.post<Tenant.RegistTenantResponse>(Endpoints.CREATE_TENANT(item.tenantId), tenant);
};
