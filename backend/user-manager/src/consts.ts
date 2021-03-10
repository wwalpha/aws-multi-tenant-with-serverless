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
  CREATE_TENANT_ADMIN: `${Environments.SERVICE_ENDPOINT_USER}/user/admin`,
  /** User Manager: find user */
  LOOKUP_USER: (userName: string) => `${Environments.SERVICE_ENDPOINT_USER}/user/pool/${userName}`,
  /** User Manager: destroy all tenant include cognito pool, identity pool, iam */
  DESTROY_ALL_TENANTS: `${Environments.SERVICE_ENDPOINT_USER}/user/tenants`,
  /** User Manager: Get a list of users using a tenant id to scope the list */
  GET_USERS: `${Environments.SERVICE_ENDPOINT_USER}/users`,
  /** Tenant Manager: create a tenant */
  CREATE_TENANT: `${Environments.SERVICE_ENDPOINT_TENANT}/tenant`,
  /** Tenant Manager: get tenant details */
  GET_TENANT: (tenantId: string) => `${Environments.SERVICE_ENDPOINT_TENANT}/tenant/${tenantId}`,
  /** Tenant Manager: update tenant details */
  UPDATE_TENANT: (tenantId: string) => `${Environments.SERVICE_ENDPOINT_TENANT}/tenant/${tenantId}`,
  /** Tenant Manager: delete a tenant */
  DELETE_TENANT: (tenantId: string) => `${Environments.SERVICE_ENDPOINT_TENANT}/tenant/${tenantId}`,
};

/**
 * principals for cognito
 *
 * @param identityPoolId identity pool id
 */
export const COGNITO_PRINCIPALS = (identityPoolId: string) => `{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "cognito-identity.amazonaws.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "cognito-identity.amazonaws.com:aud": "${identityPoolId}"
        },
        "ForAnyValue:StringLike": {
          "cognito-identity.amazonaws.com:amr": "authenticated"
        }
      }
    }
  ]
}
`;

/**
 * tenant admin user policy
 *
 * @param tenantId tenant id
 * @param userpoolArn user pool arn
 * @param userArn user table arn
 * @param orderArn order table arn
 * @param productArn product table arn
 */
export const TENANT_ADMIN_POLICY = (
  tenantId: string,
  userpoolArn: string,
  userArn?: string,
  orderArn?: string,
  productArn?: string
) => `{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:BatchGetItem",
        "dynamodb:Query",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:BatchWriteItem",
        "dynamodb:DescribeTable",
        "dynamodb:CreateTable"
      ],
      "Resource": [
        "${userArn}", 
        "${userArn}/*",
        "${orderArn}",
        "${productArn}"
      ],
      "Condition": {
        "ForAllValues:StringEquals": {
          "dynamodb:LeadingKeys": ["${tenantId}"]
        }
      }
    },
    {
      "Effect": "Allow",
      "Action": [
        "cognito-idp:AdminCreateUser",
        "cognito-idp:AdminDeleteUser",
        "cognito-idp:AdminDisableUser",
        "cognito-idp:AdminEnableUser",
        "cognito-idp:AdminGetUser",
        "cognito-idp:ListUsers",
        "cognito-idp:AdminUpdateUserAttributes"
      ],
      "Resource": ["${userpoolArn}"]
    }
  ]
}
`;

/**
 * normal user policy
 *
 * @param tenantId tenant id
 * @param userpoolArn user pool arn
 * @param userArn user table arn
 * @param orderArn order table arn
 * @param productArn product table arn
 */
export const TENANT_USER_POLICY = (
  tenantId: string,
  userpoolArn: string,
  userArn?: string,
  orderArn?: string,
  productArn?: string
) => `{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:BatchGetItem",
        "dynamodb:Query",
        "dynamodb:DescribeTable",
        "dynamodb:CreateTable"
      ],
      "Resource": [
        "${userArn}",
        "${userArn}/*",
        "${productArn}"
      ],
      "Condition": {
        "ForAllValues:StringEquals": {
          "dynamodb:LeadingKeys": ["${tenantId}"]
        }
      }
    },
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:BatchGetItem",
        "dynamodb:Query",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:BatchWriteItem",
        "dynamodb:DescribeTable",
        "dynamodb:CreateTable"
      ],
      "Resource": [
        "${orderArn}"
      ],
      "Condition": {
        "ForAllValues:StringEquals": {
          "dynamodb:LeadingKeys": ["${tenantId}"]
        }
      }
    },
    {
      "Effect": "Allow",
      "Action": ["cognito-idp:AdminGetUser", "cognito-idp:ListUsers"],
      "Resource": ["${userpoolArn}"]
    }
  ]
}
`;

/**
 * system admin user policy
 *
 * @param tenantArn tenant table arn
 * @param userArn user table arn
 * @param orderArn order table arn
 * @param productArn product table arn
 */
export const SYSTEM_ADMIN_POLICY = (tenantArn?: string, userArn?: string, orderArn?: string, productArn?: string) => `{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["dynamodb:*"],
      "Resource": [
        "${tenantArn}", 
        "${userArn}",
        "${userArn}/*",
        "${orderArn}",
        "${productArn}"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "cognito-identity:*",
        "cognito-idp:*"
      ],
      "Resource": ["*"]
    }
  ]
}
`;

/**
 * system admin user policy
 *
 * @param tenantArn tenant table arn
 * @param userArn user table arn
 * @param orderArn order table arn
 * @param productArn product table arn
 */
export const SYSTEM_USER_POLICY = (tenantArn?: string, userArn?: string, orderArn?: string, productArn?: string) => `{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:BatchGetItem",
        "dynamodb:Scan",
        "dynamodb:Query",
        "dynamodb:DescribeTable",
        "dynamodb:CreateTable"
      ],
      "Resource": [
        "${tenantArn}", 
        "${userArn}",
        "${orderArn}",
        "${productArn}"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "cognito-identity:DescribeIdentity",
        "cognito-identity:DescribeIdentityPool",
        "cognito-identity:GetIdentityPoolRoles",
        "cognito-identity:ListIdentities",
        "cognito-identity:ListIdentityPools",
        "cognito-identity:LookupDeveloperIdentity",
        "cognito-idp:AdminGetDevice",
        "cognito-idp:AdminGetUser",
        "cognito-idp:AdminListDevices",
        "cognito-idp:AdminListGroupsForUser",
        "cognito-idp:AdminResetUserPassword",
        "cognito-idp:DescribeUserImportJob",
        "cognito-idp:DescribeUserPool",
        "cognito-idp:DescribeUserPoolClient",
        "cognito-idp:GetCSVHeader",
        "cognito-idp:GetGroup",
        "cognito-idp:ListGroups",
        "cognito-idp:ListUserImportJobs",
        "cognito-idp:ListUserPoolClients",
        "cognito-idp:ListUserPools",
        "cognito-idp:ListUsers",
        "cognito-idp:ListUsersInGroup"
      ],
      "Resource": ["*"]
    }
  ]
}
`;
