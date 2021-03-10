import axios from 'axios';
import request from 'supertest';
import { DynamodbHelper } from 'dynamodb-helper';
import server from '../src/server';
import { User } from 'typings';
import { initializeUserTest } from './utils';

axios.defaults.baseURL = 'http://localhost:8080';
let accessToken: any;

describe('user manager test', () => {
  const userPoolId = 'ap-northeast-2_1FFPVr2cV';
  const clientId = '5bqt63qduk23insc7s9lgjvsem';
  const identityPoolId = 'ap-northeast-2:1791c037-bfbf-4f44-bf4d-b2fc958bd2d6';
  const username = 'wwalpha@gmail.com';
  const password = '6RXJzYRZ';
  const tenantId = 'TENANT_TEST001';

  beforeAll(async () => {
    accessToken = await initializeUserTest(userPoolId, clientId, identityPoolId, username, password);
  });

  // afterAll(async () => await clean(tenantId, userName));

  const helper = new DynamodbHelper({
    options: {
      endpoint: process.env.AWS_ENDPOINT_URL,
    },
  });

  it('get all users', async () => {
    const res = await request(server).get('/users').set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({});
  });

  it('create user', async () => {
    const res = await request(server)
      .post('/user')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        tenantId: tenantId,
        companyName: 'company001',
        email: 'test@test.com',
        firstName: 'first002',
        lastName: 'last002',
        tier: 'Premium',
      } as User.CreateUserRequest);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      tenantId: tenantId,
      companyName: 'company001',
      email: 'test@test.com',
      firstName: 'first002',
      lastName: 'last002',
      tier: 'Premium',
      userName: 'test@test.com',
    } as User.CreateUserResponse);
  });

  it('get user details', async () => {
    const res = await request(server).get('/user/test@test.com').set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      userName: 'test@test.com',
      enabled: true,
      status: 'test',
      firstName: 'first002',
      lastName: 'last002',
    } as User.GetUserResponse);
  });

  it('update user details', async () => {
    const res = await request(server)
      .put('/user/test@test.com')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        firstName: 'first003',
        lastName: 'last003',
        status: 'DISABLED',
      } as User.UpdateUserRequest);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      status: 'success',
    } as User.UpdateUserResponse);
  });

  it('delete user', async () => {
    const res = await request(server).delete('/user/test@test.com').set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      status: 'success',
    } as User.DeleteUserResponse);
  });
});
