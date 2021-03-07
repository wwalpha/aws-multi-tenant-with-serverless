import express from 'express';
import { json, urlencoded } from 'body-parser';
import { common, getCredentialsFromToken } from './app';

// instantiate application
const app = express();

// configure middleware
app.use(json());
app.use(urlencoded({ extended: false }));

/** get credentials from token */
app.get('/token/user', async (req, res) => await common(req, res, getCredentialsFromToken));

export default app;
