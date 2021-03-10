import { DynamodbHelper } from 'dynamodb-helper';
import request from 'supertest';
import server from '../src/server';
import { Environments } from '../src/consts';
import { Tables, Tenant } from 'typings';

describe('tenant manager', () => {
  const tenantId = 'TENANT1234567890';
  const jwtToken =
    'eyJraWQiOiJBMkNISnVCTTM2cDFMeDVcL28zM2NTY3JzTE1pUGRUOFlYVVFxTDRYblpcL0U9IiwiYWxnIjoiUlMyNTYifQ.eyJzdWIiOiIyNzU5MjQ5Yi05OGM0LTRhNDAtOWI5NC1hOTI0NTZjMzY1YjgiLCJjdXN0b206dGllciI6IlN0YW5kYXJkIiwiaXNzIjoiaHR0cHM6XC9cL2NvZ25pdG8taWRwLmFwLW5vcnRoZWFzdC0yLmFtYXpvbmF3cy5jb21cL2FwLW5vcnRoZWFzdC0yX0pNbDh0MEtPcCIsImNvZ25pdG86dXNlcm5hbWUiOiJ3d2FscGhhQGdtYWlsLmNvbSIsImN1c3RvbTp0ZW5hbnRfaWQiOiJURU5BTlRlN2RjODMwMjM1NTQ0NjczOTM2Yjg1NDZiYTUwODJiMyIsImdpdmVuX25hbWUiOiJmaXJzdDAwMSIsImF1ZCI6IjVyZjk0b3Rkb3NncXIxbHBhcHRmYTZmbmdpIiwiZXZlbnRfaWQiOiIzYmZhNTRjYy0zY2RjLTQxZmUtOTBlYi01MDg4ODc0NDBkNmQiLCJ0b2tlbl91c2UiOiJpZCIsImF1dGhfdGltZSI6MTYxNTM2MjI4OCwiZXhwIjoxNjE1MzY1ODg4LCJjdXN0b206cm9sZSI6IlRFTkFOVF9BRE1JTiIsImlhdCI6MTYxNTM2MjI4OCwiZmFtaWx5X25hbWUiOiJsYXN0MDAxIiwiZW1haWwiOiJ3d2FscGhhQGdtYWlsLmNvbSJ9.MWAnO97Zsa1ZB4hRLe40tVw5KmN2zJO-RT0nnUrnP70hizeGnEp0S8r5_jwMn8Wbl-I2BeW0ynbyCowZiIsQ2uUg6YpNQYjflBP4OngWWFY9hkJJwzt0Xk0T4lTiMuiNxBVewmkR-zv_EU1oJzRBVANbo8rkq1T_EWRGFvAC_lSHq8oloBU_dEw3V46UW3qGh51dekchdi4teBGpZdYAWHBSoE0_6nLXOUwJ36TOPkEeY1-2TosTuP9UGbG12so3yrz_6XPuE8eAxNR8M_NYcgM2zoWEc9yhqL-ZqIke30-d_WUI3Nlfg6X53jaD_Mie4xddrFalcZu03cQrzbDERQ';

  it('health check', async () => {
    const res = await request(server).get('/tenant/health');

    expect(res.status).toBe(200);
    // except success
    expect(res.body).toMatchObject({ service: 'Tenant Manager', isAlive: true });
  });

  // regist tenant
  it('create a tenant', async () => {
    const send: Tenant.CreateTenantRequest = {
      id: tenantId,
      email: 'test@test.com',
      companyName: 'company001',
      ownerName: 'test@test.com',
      tier: 'Standard',
      userPoolId: 'user_pool_id',
      clientId: 'client_id',
      identityPoolId: 'identity_pool_id',
      firstName: 'first001',
      lastName: 'last001',
    };

    const res = await request(server).post(`/tenant`).send(send).set('Content-Type', 'application/json');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: 'success' });

    const helper = new DynamodbHelper();
    const key: Tables.TenantKey = {
      id: tenantId,
    };
    const result = await helper.get({
      TableName: Environments.TABLE_NAME_TENANT,
      Key: key,
    });

    const matchObject: Tables.TenantItem = {
      id: tenantId,
      ownerName: 'test@test.com',
      email: 'test@test.com',
      firstName: 'first001',
      lastName: 'last001',
      companyName: 'company001',
      status: 'Active',
      tier: 'Standard',
      userPoolId: 'user_pool_id',
      clientId: 'client_id',
      identityPoolId: 'identity_pool_id',
    };

    expect(result?.Item).toMatchObject(matchObject);
  });

  it('get tenant details', async () => {
    const res = await request(server)
      .get(`/tenant/${tenantId}`)
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${jwtToken}`);

    expect(res.status).toBe(200);

    const matchObject: Tenant.UpdateTenantResponse = {
      id: tenantId,
      ownerName: 'test@test.com',
      email: 'test@test.com',
      companyName: 'test111',
      firstName: 'first001',
      lastName: 'last001',
      tier: 'Basic',
      status: 'Active',
      userPoolId: 'user_pool_id',
      clientId: 'client_id',
      identityPoolId: 'identity_pool_id',
    };
    // result
    expect(res.body).toMatchObject(matchObject);
  });

  // update tenant
  it.skip('update tenant details', async () => {
    const send: Tenant.UpdateTenantRequest = {
      companyName: 'test111',
      tier: 'Basic',
    };

    const res = await request(server)
      .put(`/tenant/${tenantId}`)
      .send(send)
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${jwtToken}`);

    // error
    expect(res.status).toBe(200);

    const matchObject: Tenant.UpdateTenantResponse = {
      id: tenantId,
      ownerName: 'test@test.com',
      email: 'test@test.com',
      companyName: 'test111',
      firstName: 'first001',
      lastName: 'last001',
      tier: 'Basic',
      status: 'Active',
      userPoolId: 'user_pool_id',
      clientId: 'client_id',
      identityPoolId: 'identity_pool_id',
    };
    // result
    expect(res.body).toMatchObject(matchObject);
  });

  // delete tenant
  it.skip('delete tenant', async () => {
    const res = await request(server).delete(`/tenant/${tenantId}`).set('Authorization', `Bearer ${jwtToken}`);

    expect(res.body).toMatchObject({ status: 'success' });

    const helper = new DynamodbHelper();

    const result = await helper.get({
      TableName: Environments.TABLE_NAME_TENANT,
      Key: {
        id: tenantId,
      } as Tables.TenantKey,
    });

    expect(result?.Item).toBeUndefined;
  });
});
