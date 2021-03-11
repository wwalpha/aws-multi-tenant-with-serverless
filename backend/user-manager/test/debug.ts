import { CognitoIdentityServiceProvider } from 'aws-sdk';
import { Auth, CognitoUser } from '@aws-amplify/auth';

const client = new CognitoIdentityServiceProvider({ region: 'ap-northeast-2' });

const clientId = 'r6bspt1frchn70a950er8lnbg';
const identityPoolId = 'ap-northeast-2:ae278997-c9e9-4a7f-bca1-7df2724622c4';
const userPoolId = 'ap-northeast-2_SuV3AAVmt';
const username = 'wwalpha@gmail.com';
const newPassword = '6RXJzYRZ';

const start = async () => {
  const oldPassword = 'yFRfkJI7';

  const r = await client
    .adminInitiateAuth({
      UserPoolId: userPoolId,
      ClientId: clientId,
      AuthFlow: 'ADMIN_NO_SRP_AUTH',
      AuthParameters: {
        USERNAME: username,
        PASSWORD: oldPassword,
      },
    })
    .promise();

  const t = await client
    .adminRespondToAuthChallenge({
      ClientId: clientId,
      UserPoolId: userPoolId,
      ChallengeName: r.ChallengeName as string,
      ChallengeResponses: {
        USERNAME: username,
        NEW_PASSWORD: newPassword,
      },
      Session: r.Session,
    })
    .promise();

  console.log(t);
};

const login = async () => {
  Auth.configure({
    // REQUIRED only for Federated Authentication - Amazon Cognito Identity Pool ID
    identityPoolId: identityPoolId,
    // REQUIRED - Amazon Cognito Region
    region: process.env.AWS_DEFAULT_REGION,
    // OPTIONAL - Amazon Cognito User Pool ID
    userPoolId: userPoolId,
    // OPTIONAL - Amazon Cognito Web Client ID (26-char alphanumeric string)
    userPoolWebClientId: clientId,
  });

  const u = (await Auth.signIn({
    username: username,
    password: newPassword,
  })) as CognitoUser;

  console.log(u.getSignInUserSession()?.getIdToken().getJwtToken());
};

start().then(() => login());
