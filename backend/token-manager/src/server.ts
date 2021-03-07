import express from 'express';
import { json, urlencoded } from 'body-parser';
import { common, getCredentialsFromToken, healthCheck } from './app';

// instantiate application
const app = express();

// configure middleware
app.use(json());
app.use(urlencoded({ extended: false }));

// health check
app.get('/token/health', async (req, res) => await common(req, res, healthCheck));

/** get credentials from token */
app.post('/token/user', async (req, res) => await common(req, res, getCredentialsFromToken));

export default app;
