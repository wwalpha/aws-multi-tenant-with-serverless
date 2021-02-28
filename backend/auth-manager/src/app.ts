import { CognitoUserPool, CognitoUser, AuthenticationDetails, CognitoUserSession } from 'amazon-cognito-identity-js';
import axios from 'axios';
import express from 'express';
import { UserLoginRequest, UserPoolInfo } from 'typings';
import { authenticateUser, isAuthenticateFailure } from './utils';

const USER_SERVICE_ENDPOINT = `http://${process.env.USER_SERVICE_ENDPOINT}`;

// process login request
export const auth = async (req: express.Request, res: express.Response) => {
  const request = req.body as UserLoginRequest;

  const userURL = `${USER_SERVICE_ENDPOINT}/pool/${request.username}`;

  // get userpool infos
  const response = (await axios.get<UserPoolInfo>(userURL)).data;

  try {
    // cognito user pool
    const userPool = new CognitoUserPool({
      ClientId: response.clientId,
      UserPoolId: response.userPoolId,
    });

    // cognito user
    const cognitoUser = new CognitoUser({
      Pool: userPool,
      Username: request.username,
    });

    const authDetails = new AuthenticationDetails({
      Username: request.username,
      Password: request.password,
    });

    const result = await authenticateUser(request, cognitoUser, authDetails);

    // authenticate failure
    if (isAuthenticateFailure(result)) {
      res.json(result);
      return;
    }

    const session = result as CognitoUserSession;

    // get user id token and access token
    const idToken = session.getIdToken().getJwtToken();
    const accessToken = session.getAccessToken().getJwtToken();

    res.json({ token: idToken, accessToken: accessToken });
  } catch (err) {
    res.json(err);
  }
};

// health check
export const healthCheck = (_: any, res: express.Response) => {
  res.status(200).send({ service: 'Authentication Manager', isAlive: true });
};
