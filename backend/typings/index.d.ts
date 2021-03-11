import * as Tables from './tables';
import * as Token from './token';
import * as Tenant from './tenant';
import * as User from './user';
import * as TenantReg from './tenantReg';
import * as SystemReg from './systemReg';

export { Tables, Token, Tenant, TenantReg, User, SystemReg };

export interface ServiceEndpoints {
  SERVICE_ENDPOINT_AUTH: string;
  SERVICE_ENDPOINT_TENANT: string;
  SERVICE_ENDPOINT_TOKEN: string;
  SERVICE_ENDPOINT_USER: string;
}

export interface DynamodbTables {
  TABLE_NAME_TENANT: string;
  TABLE_NAME_USER: string;
  TABLE_NAME_PRODUCT: string;
  TABLE_NAME_ORDER: string;
}
