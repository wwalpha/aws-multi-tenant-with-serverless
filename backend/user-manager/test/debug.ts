import { CognitoIdentityServiceProvider } from 'aws-sdk';

const client = new CognitoIdentityServiceProvider({ region: 'ap-northeast-2' });

const start = async () => {
  const clientId = '44t0o5satc51h35vv6cqbkf1tv';
  const userPoolId = 'ap-northeast-2_WOVrhMnzO';
  const username = 'wwalpha@gmail.com';

  const r = await client
    .adminInitiateAuth({
      UserPoolId: userPoolId,
      ClientId: clientId,
      AuthFlow: 'ADMIN_NO_SRP_AUTH',
      AuthParameters: {
        USERNAME: username,
        PASSWORD: 'OPU1Ntr/',
        // SECRET_HASH: '11saftm9hba0dsra1p0cn774vcgdk35iv6ftt0d3v6n4vk6s8le1',
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
        NEW_PASSWORD: 'Session10+',
      },
      Session: r.Session,
    })
    .promise();

  console.log(t);
  // eyJraWQiOiJ5c0p1UG1zTHlKYk82aVVCSW93VjI0UTVzRktcL202YmZyVUkrVW9JY0ZtTT0iLCJhbGciOiJSUzI1NiJ9.eyJzdWIiOiI1NTNiNjUwZC1mOWI1LTQzOGMtYWI3My00ZTg3OWJjODlhY2YiLCJjdXN0b206dGllciI6InByb2QiLCJpc3MiOiJodHRwczpcL1wvY29nbml0by1pZHAuYXAtbm9ydGhlYXN0LTIuYW1hem9uYXdzLmNvbVwvYXAtbm9ydGhlYXN0LTJfV09WcmhNbnpPIiwiY29nbml0bzp1c2VybmFtZSI6Ind3YWxwaGFAZ21haWwuY29tIiwiY3VzdG9tOnRlbmFudF9pZCI6IlRFTkFOVDAwMDAwMDAwMDIiLCJnaXZlbl9uYW1lIjoiZmlyc3QxMTEiLCJhdWQiOiI0NHQwbzVzYXRjNTFoMzV2djZjcWJrZjF0diIsImV2ZW50X2lkIjoiMjYwNDQyNzktYWFiYS00YzJiLWI3NjktOWZhNGVjMzc4OWZjIiwidG9rZW5fdXNlIjoiaWQiLCJhdXRoX3RpbWUiOjE2MTUwODI5MTIsImV4cCI6MTYxNTA4NjUxMiwiY3VzdG9tOnJvbGUiOiJURU5BTlRfQURNSU4iLCJpYXQiOjE2MTUwODI5MTIsImZhbWlseV9uYW1lIjoibGFzdDIyMiIsImVtYWlsIjoid3dhbHBoYUBnbWFpbC5jb20ifQ.OowtDzdwzXhWAAvtC3_QXzVW3CmpneaxT9niG7e2CFvwqmeWxQ4y060Bpst0dGsIU4GwSbIMElZpdf3v3VIOTwDaT154LhGUbDrZemzNZx8jUCHHH8jWDJbphSToCqj5mTjzBHmOXm-IGx-436aGDfgJ2lhEAJ-VLhS1NVmP0k9-kCmjQ7zRGTccz5PfFshXhBtiSwYZgPZNn81jdPA3zeqfDZwec1yBKUQBo3L85vEQidylzGz9h6ZKKs1DcE_oKk2hLmwj3rh56RCXLKnWrQ9_8YDqHUqKR6A9Zrt3v6le047kHfrZwep8nhdOmo3s7YOETe70LPhcM2eTv_ipWg
};

start();

// aws cognito-idp admin-initiate-auth \
// --user-pool-id 'ap-northeast-2_WOVrhMnzO' \
// --client-id '74q4v7eih0ub794t2995833p48' \
// --auth-flow ADMIN_NO_SRP_AUTH \
// --auth-parameters \
// USERNAME=wwalpha@gmail.com,PASSWORD=OPU1Ntr/,SECRET_HASH=11saftm9hba0dsra1p0cn774vcgdk35iv6ftt0d3v6n4vk6s8le1 \
// --region ap-northeast-2
