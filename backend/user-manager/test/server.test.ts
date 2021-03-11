import axios from 'axios';
import { v4 } from 'uuid';
import request from 'supertest';
import { DynamodbHelper } from 'dynamodb-helper';
import server from './server';
import { User, Tables } from 'typings';
import { Environments } from './consts';
import { clean, initialize } from './utils';

axios.defaults.baseURL = 'http://localhost:8080';

let userPoolId: string;
let identityPoolId: string;

describe('user manager test', () => {
  const tenantId = `TENANT${v4().split('-').join('')}`;
  const userName = 'wwalpha@gmail.com';

  beforeAll(async () => await initialize());
  afterAll(async () => await clean(tenantId, userName));

  const helper = new DynamodbHelper({
    options: {
      endpoint: process.env.AWS_ENDPOINT_URL,
    },
  });

  it('service health check', async () => {
    const res = await request(server).get('/user/health');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ isAlive: true, service: 'User Manager' });
  });

  it('regist tenant admin user', async () => {
    const send: User.CreateAdminRequest = {
      tenantId: tenantId,
      companyName: 'Company001',
      email: userName,
      firstName: 'first111',
      lastName: 'last222',
      tier: 'Standard',
      userName: userName,
    };
    const res = await request(server).post('/user/admin').send(send);

    // status code
    expect(res.status).toBe(200);
    // response
    expect(res.body).toEqual(
      expect.objectContaining({
        email: userName,
        firstName: 'first111',
        lastName: 'last222',
        role: 'TENANT_ADMIN',
        tenantId: tenantId,
        tier: 'Standard',
        companyName: 'Company001',
      })
    );

    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('userPoolId');
    expect(res.body).toHaveProperty('clientId');
    expect(res.body).toHaveProperty('identityPoolId');
    expect(res.body).toHaveProperty('sub');

    const response = res.body as User.CreateAdminResponse;

    const tenant = await helper.get({
      TableName: Environments.TABLE_NAME_USER,
      Key: {
        tenantId: tenantId,
        id: response.id,
      } as Tables.UserKey,
    });

    expect(tenant?.Item?.userPoolId).toEqual(response.userPoolId);
    expect(tenant?.Item?.clientId).toEqual(response.clientId);
    expect(tenant?.Item?.identityPoolId).toEqual(response.identityPoolId);
    expect(tenant?.Item?.sub).toEqual(response.sub);

    userPoolId = response.userPoolId;
    identityPoolId = response.identityPoolId;
  });

  it('lookup user and founded', async () => {
    const res = await request(server).get(`/user/pool/${userName}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ isExist: true });
  });

  it('lookup user and not found', async () => {
    const res = await request(server).get('/user/pool/f8917caf-aa3f-4b22-b33f-846b45ce9924');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ isExist: false });
  });

  it('Delete tenant', async () => {
    const res = await request(server)
      .delete('/users/tenants')
      .send({
        tenantId: tenantId,
        userPoolId: userPoolId,
        identityPoolId: identityPoolId,
      } as User.DeleteTenantRequest);

    expect(res.status).toBe(200);
  });
});
