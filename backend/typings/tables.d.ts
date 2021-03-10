export interface UserKey {
  // tenant id
  tenantId: string;
  // id
  id: string;
}

export interface UserItem extends UserKey {
  // company name
  companyName: string;
  // first name
  firstName: string;
  // last name
  lastName: string;
  // email
  email: string;
  // tier
  tier: string;
  // cognito user pool id
  userPoolId: string;
  // cognito user pool client id
  clientId?: string;
  // cognito identity pool id
  identityPoolId?: string;
  // role
  role?: string;
  // sub
  sub?: string;
}

export interface TenantKey {
  id: string;
}

export interface TenantItem extends TenantKey {
  // owner name
  ownerName: string;
  // company name
  companyName: string;
  // first name
  firstName: string;
  // last name
  lastName: string;
  // email
  email: string;
  // status
  status: string;
  // tier
  tier: string;
  // systemAdminPolicy: string;
  // systemAdminRole: string;
  // systemSupportPolicy: string;
  // systemSupportRole: string;
  // trustRole: string;
  // user pool id
  userPoolId: string;
  // client id
  clientId: string;
  // identity pool id
  identityPoolId: string;
}
