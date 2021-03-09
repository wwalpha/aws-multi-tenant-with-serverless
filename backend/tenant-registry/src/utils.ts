import axios from 'axios';
import express from 'express';
import winston from 'winston';
import { TenantReg, User } from 'typings';
import { Environments } from './consts';

// Init the winston log level
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

/** check tenant exist */
export const tenantExists = async (tenantId: string): Promise<boolean> => {
  // const res = await axios.get(`${QUERY_TENANT_URL}/id=${tenantId}`);

  // return res.status === 200;
  return false;
};

/** create tenant admin user */
export const registTenantAdmin = async (
  tenantId: string,
  request: TenantReg.RegistTenantRequest
): Promise<User.TenantAdminRegistResponse> => {
  // init the request with tenant data
  const tenantAdminData: User.TenantAdminRegistRequest = {
    tenantId: tenantId,
    companyName: request.companyName,
    userName: request.userName,
    firstName: request.firstName,
    lastName: request.lastName,
    tier: request.tier,
    email: request.email,
  };

  // regist tenant admin
  const res = await axios.post<User.TenantAdminRegistResponse>(
    `${Environments.SERVICE_ENDPOINT_USER}/user/reg`,
    tenantAdminData
  );

  if (res.status !== 200) {
    throw new Error(`Tenant admin create failed. ${res.data}`);
  }

  return res.data;
};

/** save tenant informations */
export const saveTenant = async (item: any) => {
  // const request: Tenant
  // await axios.post(CREATE_TENANT_URL, item);
};
