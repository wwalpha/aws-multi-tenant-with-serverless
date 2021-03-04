import express from 'express';
import bodyParser from 'body-parser';
import winston from 'winston';
import AWS, { DynamoDB } from 'aws-sdk';
import { common, deleteTenant, getTenant, healthCheck, registTenant, updateTanant } from './app';

// Configure Logging
winston.add(new winston.transports.Console({ level: 'debug' }));
// Configure AWS Region
AWS.config.update({ region: process.env.AWS_DEFAULT_REGION });

// Instantiate application
const app = express();

// Configure middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// health check
app.get('/tenant/health', async (req, res) => await common(req, res, healthCheck));

// Create REST entry points
// app.get('/tenant/:id', async (req, res) => await common(req, res, getTenant));

// create a tenant
app.post('/tenant/:id', async (req, res) => await common(req, res, registTenant));

// update the tenant
app.put('/tenant/:id', async (req, res) => await common(req, res, updateTanant));

// delete the tenant
app.delete('/tenant/:id', async (req, res) => await common(req, res, deleteTenant));

// get all tenants
// app.get('/tenants', function (req, res) {
//   winston.debug('Fetching all tenants');

//   tokenManager.getCredentialsFromToken(req, function (credentials) {
//     var scanParams = {
//       TableName: tenantSchema.TableName,
//     };

//     // construct the helper object
//     var dynamoHelper = new DynamoDBHelper(tenantSchema, credentials, configuration);

//     dynamoHelper.scan(scanParams, credentials, function (error, tenants) {
//       if (error) {
//         winston.error('Error retrieving tenants: ' + error.message);
//         res.status(400).send('{"Error" : "Error retrieving tenants"}');
//       } else {
//         winston.debug('Tenants successfully retrieved');
//         res.status(200).send(tenants);
//       }
//     });
//   });
// });

// app.get('/tenants/system', function (req, res) {
//   winston.debug('Fetching all tenants required to clean up infrastructure');
//   //Note: Reference Architecture not leveraging Client Certificate to secure system only endpoints. Please integrate the following endpoint with a Client Certificate.
//   var credentials = {};
//   tokenManager.getSystemCredentials(function (systemCredentials) {
//     credentials = systemCredentials;
//     var scanParams = {
//       TableName: tenantSchema.TableName,
//     };

//     // construct the helper object
//     var dynamoHelper = new DynamoDBHelper(tenantSchema, credentials, configuration);

//     dynamoHelper.scan(scanParams, credentials, function (error, tenants) {
//       if (error) {
//         winston.error('Error retrieving tenants: ' + error.message);
//         res.status(400).send('{"Error" : "Error retrieving tenants"}');
//       } else {
//         winston.debug('Tenants successfully retrieved');
//         res.status(200).send(tenants);
//       }
//     });
//   });
// });

export default app;
