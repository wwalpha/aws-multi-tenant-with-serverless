import express from 'express';
import bodyParser from 'body-parser';
import { healthCheck, registTenant } from './app';

// Instantiate application
const app = express();

// Configure middleware
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: false,
  })
);

/** Register a new tenant */
app.post('/reg', registTenant);

/** Get the health of the service */
app.get('/reg/health', healthCheck);

// Start the servers
export default app;
