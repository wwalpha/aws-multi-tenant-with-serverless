import { DynamodbHelper } from 'dynamodb-helper';
import request from 'supertest';
import server from '../src/server';
import { Environments } from '../src/consts';
import { Tables, Tenant } from 'typings';

describe('tenant manager', () => {
  const tenantId = 'TENANT1234567890';
  const jwtToken =
    'eyJraWQiOiJiVndWUzBnV3AzREh4dDhocEQ0QXQzcitZUjY5cUZmSVBmb3ZjcjJRcjJrPSIsImFsZyI6IlJTMjU2In0.eyJzdWIiOiJkMzY4ZDU2Zi1lYjc4LTRkYjUtYjQ1NS1hYmMwYTM1Y2JiZWMiLCJjdXN0b206dGllciI6IlNZU1RFTSIsImlzcyI6Imh0dHBzOlwvXC9jb2duaXRvLWlkcC5hcC1ub3J0aGVhc3QtMi5hbWF6b25hd3MuY29tXC9hcC1ub3J0aGVhc3QtMl9TdVYzQUFWbXQiLCJjb2duaXRvOnVzZXJuYW1lIjoid3dhbHBoYUBnbWFpbC5jb20iLCJjdXN0b206dGVuYW50X2lkIjoiU1lTVEVNZmMwMDVhODNlMzgzNDU0MjhjMzUzODQ1YTQ2ZGI4NWMiLCJnaXZlbl9uYW1lIjoiZmlyc3QwMDEiLCJhdWQiOiJyNmJzcHQxZnJjaG43MGE5NTBlcjhsbmJnIiwiZXZlbnRfaWQiOiJjMmE3OGI5ZS1kMmJhLTRmNWItYmQ3MC00NzY4ZGRjZmFlYjciLCJ0b2tlbl91c2UiOiJpZCIsImF1dGhfdGltZSI6MTYxNTM4MzAxOCwiZXhwIjoxNjE1Mzg2NjE4LCJjdXN0b206cm9sZSI6IlRFTkFOVF9BRE1JTiIsImlhdCI6MTYxNTM4MzAxOCwiZmFtaWx5X25hbWUiOiJsYXN0MDAxIiwiZW1haWwiOiJ3d2FscGhhQGdtYWlsLmNvbSJ9.avGh36kEFH0v_JBHVBGOBA2r6_HUN1C_TcMS-GE-5DbEf0h1w1pi8iHfYNDdgljspcwJbzO48JYWkaxV9iGQLLe6HeDWuHwpD6jA14wpNrelFrj7LKqMF20DcucHnTIvZpkTdsKD79dGrayT12fsT3ZLWkCoaZugGgKe_mqFaz-ZKd6D2W_cEh725fYA5k31lcRetmZz5yJqUwlQyaqXb6m3bQaJjkbFxkjFuSqs_3sC1xrKu-Nqg6KvYHQDr0W6dexuMXeiKcY5VeAIiIi2aZn213QnC_R22C1f7rbTRv0j4qCx7W_sz-ZE3XyqLGDumiBJ9IOwdWt2UgA6mAjW0Q';

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

    const matchObject: Tenant.GetTenantResponse = {
      id: tenantId,
      ownerName: 'test@test.com',
      firstName: 'first001',
      lastName: 'last001',
      email: 'test@test.com',
      companyName: 'company001',
      tier: 'Standard',
      status: 'Active',
      userPoolId: 'user_pool_id',
      clientId: 'client_id',
      identityPoolId: 'identity_pool_id',
    };
    // result
    expect(res.body).toMatchObject(matchObject);
  });

  // update tenant
  it('update tenant details', async () => {
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
      // id: tenantId,
      // ownerName: 'test@test.com',
      // email: 'test@test.com',
      companyName: 'test111',
      // firstName: 'first001',
      // lastName: 'last001',
      tier: 'Basic',
      // status: 'Active',
      // userPoolId: 'user_pool_id',
      // clientId: 'client_id',
      // identityPoolId: 'identity_pool_id',
    };
    // result
    expect(res.body).toMatchObject(matchObject);
  });

  // delete tenant
  it('delete tenant', async () => {
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
