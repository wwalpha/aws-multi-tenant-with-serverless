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
