import express from 'express';
import { json, urlencoded } from 'body-parser';
import { healthCheck, registTenant, common } from './app';

// Instantiate application
const app = express();

// Configure middleware
app.use(json());
app.use(urlencoded({ extended: false }));

/** Get the health of the service */
app.get('/reg/health', async (req, res) => await common(req, res, healthCheck));

/** Register a new tenant */
app.post('/reg', async (req, res) => await common(req, res, registTenant));

// Start the servers
export default app;
