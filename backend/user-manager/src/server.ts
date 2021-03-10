import express from 'express';
import { json, urlencoded } from 'body-parser';
import {
  createTenantAdmin,
  lookupUser,
  getUsers,
  createUser,
  getUser,
  updateUser,
  deleteUser,
  healthCheck,
  common,
  deleteTenant,
} from './app';

// instantiate application
var app = express();

// configure middleware
app.use(json());
app.use(urlencoded({ extended: false }));

// health check
app.get('/user/health', async (req, res) => await common(req, res, healthCheck));

// Provision a new tenant admin user
app.post('/user/admin', async (req, res) => await common(req, res, createTenantAdmin));

// Lookup user pool for any user - no user data returned
app.get('/user/pool/:id', async (req, res) => await common(req, res, lookupUser));

// Get a list of users using a tenant id to scope the list
app.get('/users', async (req, res) => await common(req, res, getUsers));

// create a normal user
app.post('/user', async (req, res) => await common(req, res, createUser));

// get user details
app.get('/user/:id', async (req, res) => await common(req, res, getUser));

// update user details
app.put('/user/:id', async (req, res) => await common(req, res, updateUser));

// delete user
app.delete('/user/:id', async (req, res) => await common(req, res, deleteUser));

/**
 * WARNING: THIS WILL REMOVE ALL THE COGNITO USER POOLS, IDENTITY POOLS, ROLES,
 * AND POLICIES CREATED BY THIS QUICKSTART.
 * Delete Infrastructure Created by Multi-tenant Identity Reference Architecture
 */
app.delete('/users/tenants', async (req, res) => await common(req, res, deleteTenant));

// app.delete('/user/tables', deleteTables);

export default app;

// /**
//  * Get a list of users using a tenant id to scope the list
//  */
// app.get('/users', function (req, res) {
//   tokenManager.getCredentialsFromToken(req, function (credentials) {
//     var userPoolId = getUserPoolIdFromRequest(req);
//     cognitoUsers
//       .getUsersFromPool(credentials, userPoolId, configuration.aws_region)
//       .then(function (userList) {
//         res.status(200).send(userList);
//       })
//       .catch(function (error) {
//         res.status(400).send('Error retrieving user list: ' + error.message);
//       });
//   });
// });

// /**
//  * Create a new user
//  */
// app.post('/user', function (req, res) {
//   tokenManager.getCredentialsFromToken(req, function (credentials) {
//     var user = req.body;
//     winston.debug('Creating user: ' + user.userName);

//     // extract requesting user and role from the token
//     var authToken = tokenManager.getRequestAuthToken(req);
//     var decodedToken = tokenManager.decodeToken(authToken);
//     var requestingUser = decodedToken.email;
//     user.tier = decodedToken['custom:tier'];
//     user.tenant_id = decodedToken['custom:tenant_id'];

//     // get the user pool data using the requesting user
//     // all users added in the context of this user
//     lookupUserPoolData(credentials, requestingUser, user.tenant_id, false, function (err, userPoolData) {
//       // if the user pool found, proceed
//       if (!err) {
//         createNewUser(
//           credentials,
//           userPoolData.UserPoolId,
//           userPoolData.IdentityPoolId,
//           userPoolData.client_id,
//           user.tenant_id,
//           user
//         )
//           .then(function (createdUser) {
//             winston.debug('User ' + user.userName + ' created');
//             res.status(200).send({ status: 'success' });
//           })
//           .catch(function (err) {
//             winston.error('Error creating new user in DynamoDB: ' + err.message);
//             res.status(400).send('{"Error" : "Error creating user in DynamoDB"}');
//           });
//       } else {
//         res.status(400).send('{"Error" : "User pool not found"}');
//       }
//     });
//   });
// });

// /**
//  * Provision a new system admin user
//  */
// app.post('/user/system', function (req, res) {
//   var user = req.body;
//   user.tier = configuration.tier.system;
//   user.role = configuration.userRole.systemAdmin;
//   // get the credentials for the system user
//   var credentials = {};
//   tokenManager.getSystemCredentials(function (systemCredentials) {
//     if (systemCredentials) {
//       credentials = systemCredentials;
//       // provision the tenant admin and roles
//       provisionAdminUserWithRoles(
//         user,
//         credentials,
//         configuration.userRole.systemAdmin,
//         configuration.userRole.systemUser,
//         function (err, result) {
//           if (err) {
//             res.status(400).send('Error provisioning system admin user');
//           } else {
//             res.status(200).send(result);
//           }
//         }
//       );
//     } else {
//       winston.debug('Error Obtaining System Credentials');
//     }
//   });
// });

// /**
//  * Enable a user that is currently disabled
//  */
// app.put('/user/enable', function (req, res) {
//   updateUserEnabledStatus(req, true, function (err, result) {
//     if (err) res.status(400).send('Error enabling user');
//     else res.status(200).send(result);
//   });
// });

// /**
//  * Disable a user that is currently enabled
//  */
// app.put('/user/disable', function (req, res) {
//   updateUserEnabledStatus(req, false, function (err, result) {
//     if (err) res.status(400).send('Error disabling user');
//     else res.status(200).send(result);
//   });
// });

// /**
//  * Update a user's attributes
//  */
// app.put('/user', function (req, res) {
//   var user = req.body;
//   tokenManager.getCredentialsFromToken(req, function (credentials) {
//     // get the user pool id from the request
//     var userPoolId = getUserPoolIdFromRequest(req);

//     // update user data
//     cognitoUsers
//       .updateUser(credentials, user, userPoolId, configuration.aws_region)
//       .then(function (updatedUser) {
//         res.status(200).send(updatedUser);
//       })
//       .catch(function (err) {
//         res.status(400).send('Error updating user: ' + err.message);
//       });
//   });
// });

// /**
//  * Delete a user
//  */
// app.delete('/user/:id', function (req, res) {
//   var userName = req.params.id;
//   tokenManager.getCredentialsFromToken(req, function (credentials) {
//     winston.debug('Deleting user: ' + userName);

//     // get the tenant id from the request
//     var tenantId = tokenManager.getTenantId(req);

//     // see if the user exists in the system
//     lookupUserPoolData(credentials, userName, tenantId, false, function (err, userPoolData) {
//       var userPool = userPoolData;
//       // if the user pool found, proceed
//       if (err) {
//         res.status(400).send('User does not exist');
//       } else {
//         // first delete the user from Cognito
//         cognitoUsers
//           .deleteUser(credentials, userName, userPool.UserPoolId, configuration.aws_region)
//           .then(function (result) {
//             winston.debug('User ' + userName + ' deleted from Cognito');

//             // now delete the user from the user data base
//             var deleteUserParams = {
//               TableName: userSchema.TableName,
//               Key: {
//                 id: userName,
//                 tenant_id: tenantId,
//               },
//             };

//             // construct the helper object
//             var dynamoHelper = new DynamoDBHelper(userSchema, credentials, configuration);

//             // delete the user from DynamoDB
//             dynamoHelper.deleteItem(deleteUserParams, credentials, function (err, user) {
//               if (err) {
//                 winston.error('Error deleting DynamoDB user: ' + err.message);
//                 res.status(400).send('{"Error" : "Error deleting DynamoDB user"}');
//               } else {
//                 winston.debug('User ' + userName + ' deleted from DynamoDB');
//                 res.status(200).send({ status: 'success' });
//               }
//             });
//           })
//           .catch(function (error) {
//             winston.error('Error deleting Cognito user: ' + err.message);
//             res.status(400).send('{"Error" : "Error deleting user"}');
//           });
//       }
//     });
//   });
// });

// /**
//  * Provision an admin user and the associated policies/roles
//  * @param user The user being created
//  * @param credentials Credentials to use for provisioning
//  * @param adminPolicyName The name of of the admin policy to provisioned
//  * @param userPolicyName The name of the user policy to be provisioned
//  * @param callback Returns an object with the results of the provisioned items
//  */
// function provisionAdminUserWithRoles(user, credentials, adminPolicyName, userPolicyName, callback) {
//   // vars that are used across multiple calls
//   var createdUserPoolData = {};
//   var trustPolicyTemplate = {};
//   var createdTrustPolicyRole = {};
//   var createdUserPoolClient = {};
//   var createdIdentityPool = {};
//   var createdAdminPolicy = {};
//   var createdAdminRole = {};
//   var createdUserPolicy = {};
//   var createdUserRole = {};

//   // setup params for template generation
//   var policyCreationParams = {
//     tenantId: user.tenant_id,
//     accountId: configuration.aws_account,
//     region: configuration.aws_region,
//     tenantTableName: configuration.table.tenant,
//     userTableName: configuration.table.user,
//     productTableName: configuration.table.product,
//     orderTableName: configuration.table.order,
//   };

//   // init role based on admin policy name
//   user.role = adminPolicyName;

//   // see if this user is already in the system
//   lookupUserPoolData(credentials, user.userName, user.tenant_id, true, function (err, userPoolData) {
//     if (!err) {
//       callback(new Error('{"Error" : "User already exists"}'));
//       winston.debug('{"Error" : "User already exists"}');
//     } else {
//       // create the new user
//       cognitoUsers
//         .createUserPool(user.tenant_id)
//         .then(function (poolData) {
//           createdUserPoolData = poolData;

//           var clientConfigParams = {
//             ClientName: createdUserPoolData.UserPool.Name,
//             UserPoolId: createdUserPoolData.UserPool.Id,
//           };

//           // add the user pool to the policy template configuration (couldn't add until here)
//           policyCreationParams.userPoolId = createdUserPoolData.UserPool.Id;

//           // crete the user pool for the new tenant
//           return cognitoUsers.createUserPoolClient(clientConfigParams);
//         })
//         .then(function (userPoolClientData) {
//           createdUserPoolClient = userPoolClientData;
//           var identityPoolConfigParams = {
//             ClientId: userPoolClientData.UserPoolClient.ClientId,
//             UserPoolId: userPoolClientData.UserPoolClient.UserPoolId,
//             Name: userPoolClientData.UserPoolClient.ClientName,
//           };
//           return cognitoUsers.createIdentityPool(identityPoolConfigParams);
//         })
//         .then(function (identityPoolData) {
//           createdIdentityPool = identityPoolData;

//           // create and populate policy templates
//           trustPolicyTemplate = cognitoUsers.getTrustPolicy(identityPoolData.IdentityPoolId);

//           // get the admin policy template
//           var adminPolicyTemplate = cognitoUsers.getPolicyTemplate(adminPolicyName, policyCreationParams);

//           // setup policy name
//           var policyName = user.tenant_id + '-' + adminPolicyName + 'Policy';

//           // configure params for policy provisioning calls
//           var adminPolicyParams = {
//             policyName: policyName,
//             policyDocument: adminPolicyTemplate,
//           };

//           return cognitoUsers.createPolicy(adminPolicyParams);
//         })
//         .then(function (adminPolicy) {
//           createdAdminPolicy = adminPolicy;
//           return createNewUser(
//             credentials,
//             createdUserPoolData.UserPool.Id,
//             createdIdentityPool.IdentityPoolId,
//             createdUserPoolClient.UserPoolClient.ClientId,
//             user.tenant_id,
//             user
//           );
//         })
//         .then(function () {
//           // get the admin policy template
//           var userPolicyTemplate = cognitoUsers.getPolicyTemplate(userPolicyName, policyCreationParams);

//           // setup policy name
//           var policyName = user.tenant_id + '-' + userPolicyName + 'Policy';

//           // configure params for policy provisioning calls
//           var userPolicyParams = {
//             policyName: policyName,
//             policyDocument: userPolicyTemplate,
//           };

//           return cognitoUsers.createPolicy(userPolicyParams);
//         })
//         .then(function (userPolicy) {
//           createdUserPolicy = userPolicy;

//           var adminRoleName = user.tenant_id + '-' + adminPolicyName;
//           var adminRoleParams = {
//             policyDocument: trustPolicyTemplate,
//             roleName: adminRoleName,
//           };

//           return cognitoUsers.createRole(adminRoleParams);
//         })
//         .then(function (adminRole) {
//           createdAdminRole = adminRole;

//           var userRoleName = user.tenant_id + '-' + userPolicyName;
//           var userRoleParams = {
//             policyDocument: trustPolicyTemplate,
//             roleName: userRoleName,
//           };

//           return cognitoUsers.createRole(userRoleParams);
//         })
//         .then(function (userRole) {
//           createdUserRole = userRole;
//           var trustPolicyRoleName = user.tenant_id + '-Trust';
//           var trustPolicyRoleParams = {
//             policyDocument: trustPolicyTemplate,
//             roleName: trustPolicyRoleName,
//           };

//           return cognitoUsers.createRole(trustPolicyRoleParams);
//         })
//         .then(function (trustPolicyRole) {
//           createdTrustPolicyRole = trustPolicyRole;
//           var adminPolicyRoleParams = {
//             PolicyArn: createdAdminPolicy.Policy.Arn,
//             RoleName: createdAdminRole.Role.RoleName,
//           };

//           return cognitoUsers.addPolicyToRole(adminPolicyRoleParams);
//         })
//         .then(function () {
//           var userPolicyRoleParams = {
//             PolicyArn: createdUserPolicy.Policy.Arn,
//             RoleName: createdUserRole.Role.RoleName,
//           };

//           return cognitoUsers.addPolicyToRole(userPolicyRoleParams);
//         })
//         .then(function () {
//           var addRoleToIdentityParams = {
//             IdentityPoolId: createdIdentityPool.IdentityPoolId,
//             trustAuthRole: createdTrustPolicyRole.Role.Arn,
//             rolesystem: createdAdminRole.Role.Arn,
//             rolesupportOnly: createdUserRole.Role.Arn,
//             ClientId: createdUserPoolClient.UserPoolClient.ClientId,
//             provider: createdUserPoolClient.UserPoolClient.UserPoolId,
//             adminRoleName: adminPolicyName,
//             userRoleName: userPolicyName,
//           };

//           return cognitoUsers.addRoleToIdentity(addRoleToIdentityParams);
//         })
//         .then(function (identityRole) {
//           var returnObject = {
//             pool: createdUserPoolData,
//             userPoolClient: createdUserPoolClient,
//             identityPool: createdIdentityPool,
//             role: {
//               systemAdminRole: createdAdminRole.Role.RoleName,
//               systemSupportRole: createdUserRole.Role.RoleName,
//               trustRole: createdTrustPolicyRole.Role.RoleName,
//             },
//             policy: {
//               systemAdminPolicy: createdAdminPolicy.Policy.Arn,
//               systemSupportPolicy: createdUserPolicy.Policy.Arn,
//             },
//             addRoleToIdentity: identityRole,
//           };
//           callback(null, returnObject);
//         })
//         .catch(function (err) {
//           winston.debug(err);
//           callback(err);
//         });
//     }
//   });
// }

// /**
//  * Create a new user using the supplied credentials/user
//  * @param credentials The creds used for the user creation
//  * @param userPoolId The user pool where the user will be added
//  * @param identityPoolId the identityPoolId
//  * @param clientId The client identifier
//  * @param tenantId The tenant identifier
//  * @param newUser The data fro the user being created
//  * @param callback Callback with results for created user
//  */
// function createNewUser(credentials, userPoolId, identityPoolId, clientId, tenantId, newUser) {
//   var promise = new Promise(function (resolve, reject) {
//     // fill in system attributes for user (not passed in POST)
//     newUser.userPoolId = userPoolId;
//     newUser.tenant_id = tenantId;
//     newUser.email = newUser.userName;
//     // cerate the user in Cognito
//     cognitoUsers.createUser(credentials, newUser, function (err, cognitoUser) {
//       if (err) reject(err);
//       else {
//         // populate the user to store in DynamoDB
//         newUser.id = newUser.userName;
//         newUser.UserPoolId = userPoolId;
//         newUser.IdentityPoolId = identityPoolId;
//         newUser.client_id = clientId;
//         newUser.tenant_id = tenantId;
//         newUser.sub = cognitoUser.User.Attributes[0].Value;

//         // construct the helper object
//         var dynamoHelper = new DynamoDBHelper(userSchema, credentials, configuration);

//         dynamoHelper.putItem(newUser, credentials, function (err, createdUser) {
//           if (err) {
//             reject(err);
//           } else {
//             resolve(null, createdUser);
//           }
//         });
//       }
//     });
//   });

//   return promise;
// }

// /**
//  * Lookup a user's pool data in the user table
//  * @param credentials The credentials used ben looking up the user
//  * @param userId The id of the user being looked up
//  * @param tenantId The id of the tenant (if this is not system context)
//  * @param isSystemContext Is this being called in the context of a system user (registration, system user provisioning)
//  * @param callback The results of the lookup
//  */
// function lookupUserPoolData(credentials, userId, tenantId, isSystemContext, callback) {
//   // construct the helper object
//   var dynamoHelper = new DynamoDBHelper(userSchema, credentials, configuration);

//   // if we're looking this up in a system context, query the GSI with user name only
//   if (isSystemContext) {
//     // init params structure with request params
//     var searchParams = {
//       TableName: userSchema.TableName,
//       IndexName: userSchema.GlobalSecondaryIndexes[0].IndexName,
//       KeyConditionExpression: 'id = :id',
//       ExpressionAttributeValues: {
//         ':id': userId,
//       },
//     };

//     // get the item from the database
//     dynamoHelper.query(searchParams, credentials, function (err, users) {
//       if (err) {
//         winston.error('Error getting user: ' + err.message);
//         callback(err);
//       } else {
//         if (users.length == 0) {
//           var err = new Error('No user found: ' + userId);
//           callback(err);
//         } else callback(null, users[0]);
//       }
//     });
//   } else {
//     // if this is a tenant context, then we must get with tenant id scope
//     var searchParams = {
//       id: userId,
//       tenant_id: tenantId,
//     };

//     // get the item from the database
//     dynamoHelper.getItem(searchParams, credentials, function (err, user) {
//       if (err) {
//         winston.error('Error getting user: ' + err.message);
//         callback(err);
//       } else {
//         callback(null, user);
//       }
//     });
//   }
// }

// /**
//  * Enable/disable a user
//  * @param req The request with the user information
//  * @param enable True if enabling, False if disabling
//  * @param callback Return results of applying enable/disable
//  */
// function updateUserEnabledStatus(req, enable, callback) {
//   var user = req.body;

//   tokenManager.getCredentialsFromToken(req, function (credentials) {
//     // get the tenant id from the request
//     var tenantId = tokenManager.getTenantId(req);

//     // Get additional user data required for enabled/disable
//     lookupUserPoolData(credentials, user.userName, tenantId, false, function (err, userPoolData) {
//       var userPool = userPoolData;

//       // if the user pool found, proceed
//       if (err) {
//         callback(err);
//       } else {
//         // update the user enabled status
//         cognitoUsers
//           .updateUserEnabledStatus(credentials, userPool.UserPoolId, user.userName, enable)
//           .then(function () {
//             callback(null, { status: 'success' });
//           })
//           .catch(function (err) {
//             callback(err);
//           });
//       }
//     });
//   });
// }
