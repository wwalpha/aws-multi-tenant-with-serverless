'use strict';

// Declare dependencies
const AWS = require('aws-sdk');
const winston = require('winston');

// Configure Environment
const configModule = require('../shared-modules/config-helper/config.js');
var configuration = configModule.configure(process.env.NODE_ENV);

// Init the winston log level
winston.add(new winston.transports.Console({ level: configuration.loglevel }));

/**
 * Get user attributes from Cognito
 * @param credentials The credentials
 * @param user The user being looked up
 * @param callback Callback with user attributes populated
 */
module.exports.getCognitoUser = function (credentials, user, callback) {
  // init service provider
  var cognitoidentityserviceprovider = initCognitoServiceProvider(credentials);

  // configure params
  var params = {
    UserPoolId: user.userPoolId /* required */,
    Username: user.userName /* required */,
  };

  // get user data from Cognito
  cognitoidentityserviceprovider.adminGetUser(params, function (err, cognitoUser) {
    if (err) {
      winston.debug('Error getting user from Cognito: ', err);
      callback(err);
    } else {
      var user = getUserFromCognitoUser(cognitoUser, cognitoUser.UserAttributes);
      callback(null, user);
    }
  });
};

/**
 * Convert Cognito user to generic user
 * @param cognitoUser The user to convert
 * @return Populate User object
 */
function getUserFromCognitoUser(cognitoUser, attributeList) {
  var user = {};
  try {
    user.userName = cognitoUser.Username;
    user.enabled = cognitoUser.Enabled;
    user.confirmedStatus = cognitoUser.UserStatus;
    user.dateCreated = cognitoUser.UserCreateDate;
    attributeList.forEach(function (attribute) {
      if (attribute.Name === 'given_name') user.firstName = attribute.Value;
      else if (attribute.Name == 'family_name') user.lastName = attribute.Value;
      else if (attribute.Name == 'custom:role') user.role = attribute.Value;
      else if (attribute.Name == 'custom:tier') user.tier = attribute.Value;
      else if (attribute.Name == 'custom:email') user.email = attribute.Value;
    });
  } catch (error) {
    winston.error('Error populating user from Cognito user: ', error);
    throw error;
  }
  return user;
}

/**
 * Get a CognitoCredentialsProvider populated with supplied creds
 * @param credentials Credentials for hydrate the provider
 */
function initCognitoServiceProvider(credentials) {
  var cognitoidentityserviceprovider = new AWS.CognitoIdentityServiceProvider({
    apiVersion: '2016-04-18',
    sessionToken: credentials.claim.SessionToken,
    accessKeyId: credentials.claim.AccessKeyId,
    secretAccessKey: credentials.claim.SecretKey,
    region: configuration.aws_region,
  });
  return cognitoidentityserviceprovider;
}

/**
 * Generate a policy based on the specified type and configuration
 * @param policyType The type of policy to be created (system admin, system user, tenant admin, tenant user)
 * @param policyConfig The parameters used to populate the template
 * @returns The populated template
 */
module.exports.getPolicyTemplate = function (policyType, policyConfig) {
  var policyTemplate = {};

  // create the ARN prefixes for policies
  var arnPrefix = 'arn:aws:dynamodb:' + policyConfig.region + ':' + policyConfig.accountId + ':table/';
  var databaseArnPrefix = 'arn:aws:dynamodb:' + policyConfig.region + ':' + policyConfig.accountId + ':table/';
  var cognitoArn =
    'arn:aws:cognito-idp' +
    ':' +
    policyConfig.region +
    ':' +
    policyConfig.accountId +
    ':userpool/' +
    policyConfig.userPoolId;

  // populate database params
  // setup params for templates
  var policyParams = {
    tenantId: policyConfig.tenantId,
    arnPrefix: arnPrefix,
    cognitoArn: cognitoArn,
    tenantTableArn: databaseArnPrefix + policyConfig.tenantTableName,
    userTableArn: databaseArnPrefix + policyConfig.userTableName,
    productTableArn: databaseArnPrefix + policyConfig.productTableName,
    orderTableArn: databaseArnPrefix + policyConfig.orderTableName,
  };

  if (policyType === configuration.userRole.systemAdmin) policyTemplate = getSystemAdminPolicy(policyParams);
  else if (policyType === configuration.userRole.systemUser) policyTemplate = getSystemUserPolicy(policyParams);
  else if (policyType === configuration.userRole.tenantAdmin) policyTemplate = getTenantAdminPolicy(policyParams);
  else if (policyType === configuration.userRole.tenantUser) policyTemplate = getTenantUserPolicy(policyParams);

  return policyTemplate;
};

/**
 * Get the IAM policies for a Tenant Admin user
 * @param policyParams Dictionary with configuration parameters
 * @returns The populated tenant user policy template
 */
function getTenantUserPolicy(policyParams) {
  var tenantUserPolicyTemplate = ;

  return tenantUserPolicyTemplate;
}

/**
 * Get the IAM policies for a System Admin user
 * @param policyParams Dictionary with configuration parameters
 * @returns The populated tenant user policy template
 */
function getSystemAdminPolicy(policyParams) {
  var systemAdminPolicyTemplate = {
    Version: '2012-10-17',
    Statement: [
      {
        Sid: 'TenantSystemAdminTenantTable',
        Effect: 'Allow',
        Action: ['dynamodb:*'],
        Resource: [policyParams.tenantTableArn],
      },
      {
        Sid: 'TenantSystemAdminUserTable',
        Effect: 'Allow',
        Action: ['dynamodb:*'],
        Resource: [policyParams.userTableArn, policyParams.userTableArn + '/*'],
      },
      {
        Sid: 'TenantSystemAdminOrderTable',
        Effect: 'Allow',
        Action: ['dynamodb:*'],
        Resource: [policyParams.orderTableArn],
      },
      {
        Sid: 'TenantSystemAdminProductTable',
        Effect: 'Allow',
        Action: ['dynamodb:*', 'dynamodb:DescribeTable'],
        Resource: [policyParams.productTableArn],
      },
      {
        Sid: 'FullCognitoFederatedIdentityAccess',
        Effect: 'Allow',
        Action: ['cognito-identity:*'],
        Resource: ['*'],
      },
      {
        Sid: 'FullCognitoUserPoolAccess',
        Effect: 'Allow',
        Action: ['cognito-idp:*'],
        Resource: ['*'],
      },
    ],
  };
  return systemAdminPolicyTemplate;
}

/**
 /**
 * Get the IAM policies for a System Admin user
 * @param policyParams Dictionary with configuration parameters
 * @returns The populated tenant user policy template
 */
function getSystemUserPolicy(policyParams) {
  var systemUserPolicyTemplate = {
    Version: '2012-10-17',
    Statement: [
      {
        Sid: 'TenantSystemUserTenantTable',
        Effect: 'Allow',
        Action: [
          'dynamodb:GetItem',
          'dynamodb:BatchGetItem',
          'dynamodb:Scan',
          'dynamodb:Query',
          'dynamodb:DescribeTable',
          'dynamodb:CreateTable',
        ],
        Resource: [policyParams.tenantTableArn],
      },
      {
        Sid: 'TenantSystemUserUserTable',
        Effect: 'Allow',
        Action: [
          'dynamodb:GetItem',
          'dynamodb:BatchGetItem',
          'dynamodb:Scan',
          'dynamodb:Query',
          'dynamodb:DescribeTable',
          'dynamodb:CreateTable',
        ],
        Resource: [policyParams.userTableArn],
      },
      {
        Sid: 'TenantSystemUserOrderTable',
        Effect: 'Allow',
        Action: [
          'dynamodb:GetItem',
          'dynamodb:BatchGetItem',
          'dynamodb:Scan',
          'dynamodb:Query',
          'dynamodb:DescribeTable',
          'dynamodb:CreateTable',
        ],
        Resource: [policyParams.orderTableArn],
      },
      {
        Sid: 'TenantSystemUserProductTable',
        Effect: 'Allow',
        Action: [
          'dynamodb:GetItem',
          'dynamodb:BatchGetItem',
          'dynamodb:Scan',
          'dynamodb:Query',
          'dynamodb:DescribeTable',
          'dynamodb:CreateTable',
        ],
        Resource: [policyParams.productTableArn],
      },
      {
        Sid: 'FullReadCognitoIdentityAccess',
        Effect: 'Allow',
        Action: [
          'cognito-identity:DescribeIdentity',
          'cognito-identity:DescribeIdentityPool',
          'cognito-identity:GetIdentityPoolRoles',
          'cognito-identity:ListIdentities',
          'cognito-identity:ListIdentityPools',
          'cognito-identity:LookupDeveloperIdentity',
        ],
        Resource: ['*'],
      },
      {
        Sid: 'FullReadCognitoUserPoolsAccess',
        Effect: 'Allow',
        Action: [
          'cognito-idp:AdminGetDevice',
          'cognito-idp:AdminGetUser',
          'cognito-idp:AdminListDevices',
          'cognito-idp:AdminListGroupsForUser',
          'cognito-idp:AdminResetUserPassword',
          'cognito-idp:DescribeUserImportJob',
          'cognito-idp:DescribeUserPool',
          'cognito-idp:DescribeUserPoolClient',
          'cognito-idp:GetCSVHeader',
          'cognito-idp:GetGroup',
          'cognito-idp:ListGroups',
          'cognito-idp:ListUserImportJobs',
          'cognito-idp:ListUserPoolClients',
          'cognito-idp:ListUserPools',
          'cognito-idp:ListUsers',
          'cognito-idp:ListUsersInGroup',
        ],
        Resource: ['*'],
      },
    ],
  };

  return systemUserPolicyTemplate;
}

/**
 * Create a policy using the provided configuration parameters
 * @param policyParams The policy configuration
 * @param {Promise} Results of the created policy
 */
module.exports.createPolicy = function (policyParams) {
  var promise = new Promise(function (resolve, reject) {
    var iam = new AWS.IAM({ apiVersion: '2010-05-08' });

    var policyDoc = JSON.stringify(policyParams.policyDocument);
    var params = {
      PolicyDocument: policyDoc /* required */,
      PolicyName: policyParams.policyName /* required */,
      Description: policyParams.policyName,
    };

    iam.createPolicy(params, function (err, createdPolicy) {
      if (err) {
        reject(err);
      } else {
        resolve(createdPolicy);
      }
    });
  });

  return promise;
};

/**
 * Create a role from the supplied params
 * @param roleParams The role configuration
 * @param {Promise} Results of the created role
 */
module.exports.createRole = function (roleParams) {
  var promise = new Promise(function (resolve, reject) {
    var iam = new AWS.IAM({ apiVersion: '2010-05-08' });

    var policyDoc = JSON.stringify(roleParams.policyDocument);
    var params = {
      AssumeRolePolicyDocument: policyDoc /* required */,
      RoleName: roleParams.roleName,
    };

    iam.createRole(params, function (err, data) {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
  return promise;
};

/**
 * Add a created policy to a role
 * @param policyRoleParams The policy and role to be configured
 * @param {Promise} The results of the policy assignment to the role
 */
module.exports.addPolicyToRole = function (policyRoleParams) {
  var promise = new Promise(function (resolve, reject) {
    var iam = new AWS.IAM({ apiVersion: '2010-05-08' });
    var policyDoc = JSON.stringify(policyRoleParams.policyDocument);
    var params = {
      PolicyArn: policyRoleParams.PolicyArn /* required */,
      RoleName: policyRoleParams.RoleName /* required */,
    };

    iam.attachRolePolicy(params, function (err, data) {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
  return promise;
};

/**
 * Add system roles to an identity pool
 * @param identityPoolRoleParams The configuration of the pool and roles
 * @returns {Promise} Promise with status of assignment
 */
module.exports.addRoleToIdentity = function (identityPoolRoleParams) {
  var promise = new Promise(function (resolve, reject) {
    var cognitoidentity = new AWS.CognitoIdentity({ apiVersion: '2014-06-30', region: configuration.aws_region });
    var policyDoc = JSON.stringify(identityPoolRoleParams.policyDocument);
    var providerName =
      'cognito-idp.' +
      configuration.cognito_region +
      '.amazonaws.com/' +
      identityPoolRoleParams.provider +
      ':' +
      identityPoolRoleParams.ClientId;

    var params = {
      IdentityPoolId: identityPoolRoleParams.IdentityPoolId /* required */,
      Roles: {
        /* required */
        authenticated: identityPoolRoleParams.trustAuthRole,
      },
      RoleMappings: {
        Provider: {
          Type: 'Rules' /* required */,
          AmbiguousRoleResolution: 'Deny',
          RulesConfiguration: {
            Rules: [
              /* required */
              {
                Claim: 'custom:role' /* required */,
                MatchType: 'Equals' /* required */,
                RoleARN: identityPoolRoleParams.rolesystem /* required */,
                Value: identityPoolRoleParams.adminRoleName /* required */,
              },
              {
                Claim: 'custom:role' /* required */,
                MatchType: 'Equals' /* required */,
                RoleARN: identityPoolRoleParams.rolesupportOnly /* required */,
                Value: identityPoolRoleParams.userRoleName /* required */,
              },
            ],
          },
        },
      },
    };

    params = JSON.parse(JSON.stringify(params).split('Provider').join(providerName));
    cognitoidentity.setIdentityPoolRoles(params, function (err, data) {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
  return promise;
};

/**
 * Changed the enabled status of a Cognito user
 * @param credentials Credentials to be used for the call
 * @param userPoolId The user pool Id for the user to be changed
 * @param userName The user name of the user to be changed
 * @param enable True if enabling, false for disabling
 * @returns {Promise} Status of the enable/disable call
 */
module.exports.updateUserEnabledStatus = function (credentials, userPoolId, userName, enable) {
  var promise = new Promise(function (resolve, reject) {
    // configure the identity provider
    var cognitoIdentityServiceProvider = new AWS.CognitoIdentityServiceProvider({
      apiVersion: '2016-04-18',
      sessionToken: credentials.claim.SessionToken,
      accessKeyId: credentials.claim.AccessKeyId,
      secretAccessKey: credentials.claim.SecretKey,
      region: configuration.aws_region,
    });

    // init the params
    var params = {
      UserPoolId: userPoolId /* required */,
      Username: userName /* required */,
    };

    // enable/disable the Cognito user
    if (enable) {
      cognitoIdentityServiceProvider.adminEnableUser(params, function (err, data) {
        if (err) reject(err);
        else resolve(data);
      });
    } else {
      cognitoIdentityServiceProvider.adminDisableUser(params, function (err, data) {
        if (err) reject(err);
        else resolve(data);
      });
    }
  });

  return promise;
};

/**
 * Get a list of users from a user pool
 * @param credentials The credentials for the search
 * @param userPoolId The user pool id to scope the access
 * @param region The region for the search
 * @returns {Promise} A collection of found users
 */
module.exports.getUsersFromPool = function (credentials, userPoolId, region) {
  var promise = new Promise(function (resolve, reject) {
    // init the Cognito service provider
    var cognitoIdentityServiceProvider = new AWS.CognitoIdentityServiceProvider({
      apiVersion: '2016-04-18',
      sessionToken: credentials.claim.SessionToken,
      accessKeyId: credentials.claim.AccessKeyId,
      secretAccessKey: credentials.claim.SecretKey,
      region: region,
    });

    // search configuration
    var searchParams = {
      UserPoolId: userPoolId /* required */,
      AttributesToGet: [
        'email',
        'custom:tenant_id',
        'custom:role',
        'custom:tier',
        'given_name',
        'family_name',
        'sub',
        /* more items */
      ],
      Limit: 0,
    };

    // request the list of users from Cognito
    cognitoIdentityServiceProvider.listUsers(searchParams, function (err, data) {
      if (err) reject(err);
      else {
        var userList = [];
        data.Users.forEach(function (cognitoUser) {
          var user = getUserFromCognitoUser(cognitoUser, cognitoUser.Attributes);
          userList.push(user);
        });
        resolve(userList);
      }
    });
  });

  return promise;
};

/**
 * Update the attributes of a user
 * @param credentials The credentials for the update
 * @param user The information for the user being updated
 * @param region The region used for updating the user
 * @returns {Promise} The status of the user update
 */
module.exports.updateUser = function (credentials, user, userPoolId, region) {
  var promise = new Promise(function (resolve, reject) {
    var cognitoIdentityServiceProvider = new AWS.CognitoIdentityServiceProvider({
      apiVersion: '2016-04-18',
      sessionToken: credentials.claim.SessionToken,
      accessKeyId: credentials.claim.AccessKeyId,
      secretAccessKey: credentials.claim.SecretKey,
      region: region,
    });

    // init the update parameters
    var params = {
      UserAttributes: [
        /* required */
        {
          Name: 'custom:role' /* required */,
          Value: user.role,
        },
        {
          Name: 'given_name' /* required */,
          Value: user.firstName,
        },
        {
          Name: 'family_name' /* required */,
          Value: user.lastName,
        },
      ],
      UserPoolId: userPoolId /* required */,
      Username: user.userName /* required */,
    };

    // send the update to Cognito
    cognitoIdentityServiceProvider.adminUpdateUserAttributes(params, function (err, data) {
      if (err) reject(err);
      else resolve(data);
    });
  });

  return promise;
};

/**
 * Delete a user from Cognito
 * @param credentials The credentials used for the delete
 * @param userId The id of the user being deleted
 * @param userPoolId The user pool where the user resides
 * @param region The region for the credentials
 * @returns {Promise} Results of the deletion
 */
module.exports.deleteUser = function (credentials, userId, userPoolId, region) {
  var promise = new Promise(function (resolve, reject) {
    // init the identity provider
    var cognitoIdentityServiceProvider = new AWS.CognitoIdentityServiceProvider({
      apiVersion: '2016-04-18',
      sessionToken: credentials.claim.SessionToken,
      accessKeyId: credentials.claim.AccessKeyId,
      secretAccessKey: credentials.claim.SecretKey,
      region: region,
    });

    // init deletion parameters
    var params = {
      UserPoolId: userPoolId /* required */,
      Username: userId /* required */,
    };

    // call Cognito to delete the user
    cognitoIdentityServiceProvider.adminDeleteUser(params, function (err, data) {
      if (err) reject(err);
      else resolve(data);
    });
  });

  return promise;
};

/**
 * Delete a userpool from Cognito
 * @param userPoolId The user pool where the user resides
 * @param region The region for the credentials
 * @returns {Promise} Results of the deletion
 */
module.exports.deleteUserPool = function (userPoolId, region) {
  var promise = new Promise(function (resolve, reject) {
    // init the identity provider
    var cognitoIdentityServiceProvider = new AWS.CognitoIdentityServiceProvider({
      apiVersion: '2016-04-18',
      region: configuration.aws_region,
    });

    var params = {
      UserPoolId: userPoolId /* required */,
    };

    // call Cognito to delete the user
    cognitoIdentityServiceProvider.deleteUserPool(params, function (err, data) {
      if (err) reject(err);
      else resolve(data);
    });
  });

  return promise;
};

/**
 * Delete a Cognito Identity Pool with the supplied params
 * @param IdentityPoolId The client config params
 * @returns {Promise} A promise with the identity pools results
 */
module.exports.deleteIdentityPool = function (IdentityPoolId) {
  var promise = new Promise(function (resolve, reject) {
    // init identity params
    var cognitoIdentity = new AWS.CognitoIdentity({ apiVersion: '2014-06-30', region: configuration.aws_region });

    var params = {
      IdentityPoolId: IdentityPoolId /* required */,
    };

    // delete identity pool
    cognitoIdentity.deleteIdentityPool(params, function (err, data) {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });

  return promise;
};

/**
 * Delete a role from the supplied params
 * @param role The role name
 * @param {Promise} Results of the created role
 */
module.exports.deleteRole = function (role) {
  var promise = new Promise(function (resolve, reject) {
    var iam = new AWS.IAM({ apiVersion: '2010-05-08' });

    var params = {
      RoleName: role /* required */,
    };

    iam.deleteRole(params, function (err, data) {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
  return promise;
};

/**
 * Delete a policy using the provided configuration parameters
 * @param policy The policy arn
 * @param {Promise} Results of the created policy
 */
module.exports.deletePolicy = function (policy) {
  var promise = new Promise(function (resolve, reject) {
    var iam = new AWS.IAM({ apiVersion: '2010-05-08' });

    var params = {
      PolicyArn: policy /* required */,
    };
    iam.deletePolicy(params, function (err, deletedPolicy) {
      if (err) {
        reject(err);
      } else {
        resolve(deletedPolicy);
      }
    });
  });

  return promise;
};

/**
 * Detach a role policy using the provided configuration parameters
 * @param policy The policy arn
 * @param role The role name
 * @param {Promise} Results of the created policy
 */
module.exports.detachRolePolicy = function (policy, role) {
  var promise = new Promise(function (resolve, reject) {
    var iam = new AWS.IAM({ apiVersion: '2010-05-08' });
    var params = {
      PolicyArn: policy /* required */,
      RoleName: role /* required */,
    };
    iam.detachRolePolicy(params, function (err, detachedPolicy) {
      if (err) {
        reject(err);
      } else {
        resolve(detachedPolicy);
      }
    });
  });

  return promise;
};

/**
 * Delete a DynamoDB Table using the provided configuration parameters
 * @param table The DynamoDB Table Name
 * @param {Promise} Results of the created policy
 */
module.exports.deleteTable = function (table) {
  var promise = new Promise(function (resolve, reject) {
    var dynamodb = new AWS.DynamoDB({ apiVersion: '2012-08-10', region: configuration.aws_region });
    var params = {
      TableName: table /* required */,
    };
    dynamodb.deleteTable(params, function (err, data) {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });

  return promise;
};
