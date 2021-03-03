/**
 * principals for cognito
 *
 * @param identityPoolId identity pool id
 */
export const COGNITO_PRINCIPALS = (identityPoolId: string) => `
{
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
 * admin user policy
 *
 * @param tenantId tenant id
 * @param userArn user table arn
 * @param orderArn order table arn
 * @param productArn product table arn
 * @param userpoolArn user pool arn
 */
export const ADMIN_POLICY = (
  tenantId: string,
  userArn: string,
  orderArn: string,
  productArn: string,
  userpoolArn: string
) => `
{
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
 * @param userArn user table arn
 * @param orderArn order table arn
 * @param productArn product table arn
 * @param userpoolArn user pool arn
 */
export const USER_POLICY = (
  tenantId: string,
  userArn: string,
  orderArn: string,
  productArn: string,
  userpoolArn: string
) => `
{
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
