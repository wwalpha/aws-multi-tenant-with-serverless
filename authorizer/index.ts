import { CognitoIdentity, CognitoIdentityServiceProvider } from 'aws-sdk';

const client = new CognitoIdentityServiceProvider({
  region: 'ap-northeast-2',
});

export const handler = () => {
  console.log('Hello world');
};
