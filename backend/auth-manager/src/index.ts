import express from 'express';
import bodyParser from 'body-parser';
import winston from 'winston';
import { auth, healthCheck } from './app';

const TOKEN_SERVICE_ENDPOINT = `http://${process.env.TOKEN_SERVICE_ENDPOINT}`;
const USER_SERVICE_ENDPOINT = `http://${process.env.USER_SERVICE_ENDPOINT}`;

//Configure Logging
winston.add(new winston.transports.Console({ level: 'debug' }));

// Instantiate application
var app = express();

// Configure middleware
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: false,
  })
);

// health check
app.get('/auth/health', healthCheck);
// process login request
app.post('/auth', auth);

// Start the servers
app.listen(8080, () => console.log('Authenticate service started on port 8080'));
