import axios from 'axios';
import express from 'express';
import winston from 'winston';
import { Tenant, TenantReg, User } from 'typings';
import { Endpoints } from './consts';

// Configure Logging
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: {
    service: 'user-service',
  },
  transports: [new winston.transports.Console({ level: 'debug' })],
});

export const getLogger = () => logger;

/** check tenant exist */
export const tenantExists = async (userName: string): Promise<boolean> => {
  const res = await axios.get<User.LookupUserResponse>(Endpoints.LOOKUP_USER(userName));

  return res.data.isExist;
};

/** create tenant admin user */
export const registTenantAdmin = async (
  tenantId: string,
  request: TenantReg.RegistTenantRequest
): Promise<User.CreateTenantAdminResponse> => {
  // init the request with tenant data
  const tenantAdmin: User.CreateTenantAdminRequest = {
    tenantId: tenantId,
    companyName: request.companyName,
    firstName: request.firstName,
    lastName: request.lastName,
    email: request.email,
    tier: request.tier,
  };

  // regist tenant admin
  const res = await axios.post<User.CreateTenantAdminResponse>(Endpoints.CREATE_TENANT_ADMIN, tenantAdmin);

  if (res.status !== 200) {
    throw new Error(`Tenant admin create failed. ${res.data}`);
  }

  return res.data;
};

/** save tenant informations */
export const saveTenant = async (request: TenantReg.RegistTenantRequest, item: User.CreateTenantAdminResponse) => {
  const tenant: Tenant.CreateTenantRequest = {
    id: item.tenantId,
    ownerName: item.id,
    email: item.email,
    firstName: request.firstName,
    lastName: request.lastName,
    companyName: request.companyName,
    tier: request.tier,
    userPoolId: item.userPoolId,
    identityPoolId: item.identityPoolId,
    clientId: item.clientId,
  };

  // create a tenant
  await axios.post<Tenant.CreateTenantResponse>(Endpoints.CREATE_TENANT, tenant);
};
