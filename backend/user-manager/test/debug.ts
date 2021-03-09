import { CognitoIdentityServiceProvider } from 'aws-sdk';
import { Auth } from '@aws-amplify/auth';

const client = new CognitoIdentityServiceProvider({ region: 'ap-northeast-2' });

const start = async () => {
  const clientId = '2d2f9a11lhbv4ud2b7jp061dbv';
  const identityPoolId = 'ap-northeast-2:d01c46ff-ed85-4ca0-ad0a-01aa21c17716';
  const userPoolId = 'ap-northeast-2_SvUrSaeFW';
  const username = 'wwalpha@gmail.com';
  const oldPassword = 'kI9ZRrX0';
  const newPassword = 'Session10+';

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

  try {
    const u = await Auth.signIn({
      username: username,
      password: newPassword,
    });

    console.log(u);
  } catch (err) {
    console.log(err);
  }
};

const login = async () => {
  const clientId = '5gs2i7ne84oiofi2nn63ikictt';
  const identityPoolId = 'ap-northeast-2:b3cfab87-89df-47d1-a2cd-d8ab36721929';
  const userPoolId = 'ap-northeast-2_rAWHgPY7W';
  const username = 'wwalpha@gmail.com';
  const newPassword = 'Session10+';

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

  const u = await Auth.signIn({
    username: username,
    password: newPassword,
  });

  console.log(u);
};

// login();

start();

// aws cognito-idp admin-initiate-auth \
// --user-pool-id 'ap-northeast-2_WOVrhMnzO' \
// --client-id '74q4v7eih0ub794t2995833p48' \
// --auth-flow ADMIN_NO_SRP_AUTH \
// --auth-parameters \
// USERNAME=wwalpha@gmail.com,PASSWORD=OPU1Ntr/,SECRET_HASH=11saftm9hba0dsra1p0cn774vcgdk35iv6ftt0d3v6n4vk6s8le1 \
// --region ap-northeast-2
