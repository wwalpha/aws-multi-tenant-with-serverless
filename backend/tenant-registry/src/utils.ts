import axios from 'axios';
import { RegistTenantRequest, TenantItem } from 'typings/types';
import { TenantAdminRegistResponse } from 'typings/user';

const TENANT_SERVICE_ENDPOINT = `http://${process.env.TENANT_SERVICE_ENDPOINT}`;
const USER_SERVICE_ENDPOINT = `http://${process.env.USER_SERVICE_ENDPOINT}`;

// tenant admin regist
const TENANT_ADMIN_REGIST_URL = `${USER_SERVICE_ENDPOINT}/user/regist`;
// create tenant
const CREATE_TENANT_URL = `${TENANT_SERVICE_ENDPOINT}/tenant`;
// get tenant
const QUERY_TENANT_URL = `${TENANT_SERVICE_ENDPOINT}/tenant`;

/** check tenant exist */
export const tenantExists = async (tenantId: string): Promise<boolean> => {
  const res = await axios.get(`${QUERY_TENANT_URL}/id=${tenantId}`);

  return res.status === 200;
};

/** create tenant admin user */
export const registTenantAdmin = async (request: RegistTenantRequest): Promise<TenantAdminRegistResponse> => {
  // init the request with tenant data
  const tenantAdminData = {
    tenantId: request.tenantId,
    companyName: request.companyName,
    accountName: request.accountName,
    ownerName: request.ownerName,
    tier: request.tier,
    email: request.email,
    userName: request.userName,
    role: request.role,
    firstName: request.firstName,
    lastName: request.lastName,
  };

  // regist tenant admin
  const res = await axios.post<TenantAdminRegistResponse>(TENANT_ADMIN_REGIST_URL, tenantAdminData);

  if (res.status !== 200) {
    throw new Error(`Tenant admin create failed. ${res.data}`);
  }

  return res.data;
};

/** save tenant informations */
const saveTenant = async (item: TenantItem) => await axios.post(CREATE_TENANT_URL, item);
