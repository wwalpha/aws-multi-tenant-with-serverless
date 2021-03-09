export const Environments = {
  AWS_DEFAULT_REGION: process.env.AWS_DEFAULT_REGION as string,
  TABLE_NAME_TENANT: process.env.TABLE_NAME_TENANT as string,
  TABLE_NAME_USER: process.env.TABLE_NAME_USER as string,
  TABLE_NAME_PRODUCT: process.env.TABLE_NAME_PRODUCT as string,
  TABLE_NAME_ORDER: process.env.TABLE_NAME_ORDER as string,
  SERVICE_ENDPOINT_TENANT: `http://${process.env.SERVICE_ENDPOINT_TENANT}`,
  SERVICE_ENDPOINT_USER: `http://${process.env.SERVICE_ENDPOINT_USER}`,
  SERVICE_ENDPOINT_AUTH: `http://${process.env.SERVICE_ENDPOINT_AUTH}`,
  SERVICE_ENDPOINT_TOKEN: `http://${process.env.SERVICE_ENDPOINT_TOKEN}`,
  AWS_ENDPOINT_URL: process.env.AWS_ENDPOINT_URL,
};

export const Endpoints = {
  /** token-manager:  get credentials from token */
  CREDENTIALS_FROM_TOKEN: `${Environments.SERVICE_ENDPOINT_TOKEN}/token/user`,
  /** User Manager: registry tenant admin user */
  TEANT_ADMIN_REG: `${Environments.SERVICE_ENDPOINT_USER}/user/reg`,
  /** User Manager: find user */
  LOOKUP_USER: (userName: string) => `${Environments.SERVICE_ENDPOINT_USER}/user/pool/${userName}`,
  /** User Manager: destroy all tenant include cognito pool, identity pool, iam */
  DESTROY_ALL_TENANTS: `${Environments.SERVICE_ENDPOINT_USER}/user/tenants`,
  /** User Manager: Get a list of users using a tenant id to scope the list */
  GET_USERS: `${Environments.SERVICE_ENDPOINT_USER}/users`,
  /** Tenant Manager: create a tenant */
  CREATE_TENANT: (tenantId: string) => `${Environments.SERVICE_ENDPOINT_TENANT}/tenant/${tenantId}`,
  /** Tenant Manager: get tenant details */
  GET_TENANT: (tenantId: string) => `${Environments.SERVICE_ENDPOINT_TENANT}/tenant/${tenantId}`,
  /** Tenant Manager: update tenant details */
  UPDATE_TENANT: (tenantId: string) => `${Environments.SERVICE_ENDPOINT_TENANT}/tenant/${tenantId}`,
  /** Tenant Manager: delete a tenant */
  DELETE_TENANT: (tenantId: string) => `${Environments.SERVICE_ENDPOINT_TENANT}/tenant/${tenantId}`,
};
