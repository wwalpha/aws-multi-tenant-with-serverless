import express from 'express';
import { json, urlencoded } from 'body-parser';
import { healthCheck, registSystemTenant } from './app';
import { common } from './utils';

// Instantiate application
const app = express();

// Configure middleware
app.use(json());
app.use(urlencoded({ extended: false }));

/** create a system admin */
app.post('/system/admin', async (req, res) => await common(req, res, registSystemTenant));

/** delete system admin */
// app.delete('/system/admin', async (req, res) => await common(req, res, deleteAdminUser));

/** Get the health of the service */
app.get('/system/health', async (req, res) => await common(req, res, healthCheck));

// Start the servers
export default app;
