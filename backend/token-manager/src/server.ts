import express from 'express';
import bodyParser from 'body-parser';
import { common, getSystemCredentials } from './app';

// instantiate application
const app = express();

// configure middleware
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: false,
  })
);

/** get credentials from token */
// app.get('/token/user', async (req, res) => await common(req, res, getCredentialsFromToken));

/** get system credentials */
app.get('/token/system', async (req, res) => await common(req, res, getSystemCredentials));

export default app;
