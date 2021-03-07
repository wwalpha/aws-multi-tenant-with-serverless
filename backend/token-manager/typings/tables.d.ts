export interface UserKey {
  // tenant id
  tenantId: string;
  // id
  id: string;
}

export interface UserItem extends UserKey {
  // cognito user pool id
  userPoolId: string;
  // cognito user pool client id
  clientId: string;
  // cognito identity pool id
  identityPoolId: string;
  // account name
  accountName: string;
  // company name
  companyName: string;
  // owner name
  ownerName: string;
  // user name
  userName: string;
  // first name
  firstName: string;
  // last name
  lastName: string;
  // email
  email: string;
  // tier
  tier: string;
  // role
  role?: string;
  // sub
  sub?: string;
}

export interface TenantKey {
  id: string;
}

export interface TenantItem {
  accountName: string;
  companyName: string;
  ownerName: string;
  userName: string;
  email: string;
  status: string;
  systemAdminPolicy: string;
  systemAdminRole: string;
  systemSupportPolicy: string;
  systemSupportRole: string;
  tier: string;
  trustRole: string;
  identityPoolId: string;
  userPoolId: string;
}
