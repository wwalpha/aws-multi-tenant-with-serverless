export interface UserTableKey {
  // tenant id
  tenantId: string;
  // id
  id: string;
}

export interface UserTableItem extends UserTableKey {
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
