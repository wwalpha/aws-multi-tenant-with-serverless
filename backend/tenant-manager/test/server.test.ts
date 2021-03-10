import { DynamodbHelper } from 'dynamodb-helper';
import request from 'supertest';
import server from '../src/server';
import { Environments } from '../src/consts';
import { Tables, Tenant } from 'typings';

describe('tenant manager', () => {
  const tenantId = 'TENANT1234567890';

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
    const send: Tenant.GetTenantRequest = {};

    const res = await request(server)
      .get(`/tenant/${tenantId}`)
      .send(send)
      .set('Content-Type', 'application/json')
      .set(
        'Authorization',
        'Bearer eyJraWQiOiJiaTlyVyt6UTBhZ0E3b2VvUjhcLzY4am1FUDFURm1XUWo1SVVqcDM2WVphZz0iLCJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJjN2MyYmY1Ny0yYzg1LTQ1NWYtODQzYS01ZmQ1NmE1YzM3ZDQiLCJldmVudF9pZCI6IjFlNzQ0ZmNiLWQ2NzktNDlmZi1iNDA2LTU5ODNiNmQwMTJhMCIsInRva2VuX3VzZSI6ImFjY2VzcyIsInNjb3BlIjoiYXdzLmNvZ25pdG8uc2lnbmluLnVzZXIuYWRtaW4iLCJhdXRoX3RpbWUiOjE2MTUzNDk4NzMsImlzcyI6Imh0dHBzOlwvXC9jb2duaXRvLWlkcC5hcC1ub3J0aGVhc3QtMi5hbWF6b25hd3MuY29tXC9hcC1ub3J0aGVhc3QtMl8xRkZQVnIyY1YiLCJleHAiOjE2MTUzNTM0NzMsImlhdCI6MTYxNTM0OTg3MywianRpIjoiNmIyNmIyMWEtOWM1NS00NzMxLTkzZjktMjc2MmUyODcyNDlmIiwiY2xpZW50X2lkIjoiNWJxdDYzcWR1azIzaW5zYzdzOWxnanZzZW0iLCJ1c2VybmFtZSI6Ind3YWxwaGFAZ21haWwuY29tIn0.AHgAiCl9aa2CLTRpSdb3EsCBTWVcWcIaLA2kyeI-RRjE_rhs2tv7FDII-p0OUh48YX9eSgZ2-9fFCijFYp1bqwMkaubWl8zIGrw0Pk5ZXYBF2hMdnmIK2EJyq9AUYddjggPiikOUGFyDast876IXUfgkrwf5TKRouHaGs2CXe32BOYCg7gPalurOb_74KIS8LWMKkSceQxgCKGE9yN5tg1cq-fCyMfA-HJSzTv5cghxQ2jGEz1Dbikyz6E2FAngA-93-rN4MkxlUWIDI17mJSxyrSB1kPIFvYSXPojXb74RVYYfnd1ICWe5_i1AcEDTs3qviRHmNfwGkyFw_fv6uSQ'
      );

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
  it('update tenant details', async () => {
    const send: Tenant.UpdateTenantRequest = {
      companyName: 'test111',
      tier: 'Basic',
    };

    const res = await request(server)
      .put(`/tenant/${tenantId}`)
      .send(send)
      .set('Content-Type', 'application/json')
      .set(
        'Authorization',
        'Bearer eyJraWQiOiJiaTlyVyt6UTBhZ0E3b2VvUjhcLzY4am1FUDFURm1XUWo1SVVqcDM2WVphZz0iLCJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJjN2MyYmY1Ny0yYzg1LTQ1NWYtODQzYS01ZmQ1NmE1YzM3ZDQiLCJldmVudF9pZCI6IjFlNzQ0ZmNiLWQ2NzktNDlmZi1iNDA2LTU5ODNiNmQwMTJhMCIsInRva2VuX3VzZSI6ImFjY2VzcyIsInNjb3BlIjoiYXdzLmNvZ25pdG8uc2lnbmluLnVzZXIuYWRtaW4iLCJhdXRoX3RpbWUiOjE2MTUzNDk4NzMsImlzcyI6Imh0dHBzOlwvXC9jb2duaXRvLWlkcC5hcC1ub3J0aGVhc3QtMi5hbWF6b25hd3MuY29tXC9hcC1ub3J0aGVhc3QtMl8xRkZQVnIyY1YiLCJleHAiOjE2MTUzNTM0NzMsImlhdCI6MTYxNTM0OTg3MywianRpIjoiNmIyNmIyMWEtOWM1NS00NzMxLTkzZjktMjc2MmUyODcyNDlmIiwiY2xpZW50X2lkIjoiNWJxdDYzcWR1azIzaW5zYzdzOWxnanZzZW0iLCJ1c2VybmFtZSI6Ind3YWxwaGFAZ21haWwuY29tIn0.AHgAiCl9aa2CLTRpSdb3EsCBTWVcWcIaLA2kyeI-RRjE_rhs2tv7FDII-p0OUh48YX9eSgZ2-9fFCijFYp1bqwMkaubWl8zIGrw0Pk5ZXYBF2hMdnmIK2EJyq9AUYddjggPiikOUGFyDast876IXUfgkrwf5TKRouHaGs2CXe32BOYCg7gPalurOb_74KIS8LWMKkSceQxgCKGE9yN5tg1cq-fCyMfA-HJSzTv5cghxQ2jGEz1Dbikyz6E2FAngA-93-rN4MkxlUWIDI17mJSxyrSB1kPIFvYSXPojXb74RVYYfnd1ICWe5_i1AcEDTs3qviRHmNfwGkyFw_fv6uSQ'
      );

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
  it('delete tenant', async () => {
    const res = await request(server)
      .delete(`/tenant/${tenantId}`)
      .send(require('./datas/A003.Request.json'))
      .set('Content-Type', 'application/json')
      .set(
        'Authorization',
        'Bearer eyJraWQiOiJiaTlyVyt6UTBhZ0E3b2VvUjhcLzY4am1FUDFURm1XUWo1SVVqcDM2WVphZz0iLCJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJjN2MyYmY1Ny0yYzg1LTQ1NWYtODQzYS01ZmQ1NmE1YzM3ZDQiLCJldmVudF9pZCI6IjFlNzQ0ZmNiLWQ2NzktNDlmZi1iNDA2LTU5ODNiNmQwMTJhMCIsInRva2VuX3VzZSI6ImFjY2VzcyIsInNjb3BlIjoiYXdzLmNvZ25pdG8uc2lnbmluLnVzZXIuYWRtaW4iLCJhdXRoX3RpbWUiOjE2MTUzNDk4NzMsImlzcyI6Imh0dHBzOlwvXC9jb2duaXRvLWlkcC5hcC1ub3J0aGVhc3QtMi5hbWF6b25hd3MuY29tXC9hcC1ub3J0aGVhc3QtMl8xRkZQVnIyY1YiLCJleHAiOjE2MTUzNTM0NzMsImlhdCI6MTYxNTM0OTg3MywianRpIjoiNmIyNmIyMWEtOWM1NS00NzMxLTkzZjktMjc2MmUyODcyNDlmIiwiY2xpZW50X2lkIjoiNWJxdDYzcWR1azIzaW5zYzdzOWxnanZzZW0iLCJ1c2VybmFtZSI6Ind3YWxwaGFAZ21haWwuY29tIn0.AHgAiCl9aa2CLTRpSdb3EsCBTWVcWcIaLA2kyeI-RRjE_rhs2tv7FDII-p0OUh48YX9eSgZ2-9fFCijFYp1bqwMkaubWl8zIGrw0Pk5ZXYBF2hMdnmIK2EJyq9AUYddjggPiikOUGFyDast876IXUfgkrwf5TKRouHaGs2CXe32BOYCg7gPalurOb_74KIS8LWMKkSceQxgCKGE9yN5tg1cq-fCyMfA-HJSzTv5cghxQ2jGEz1Dbikyz6E2FAngA-93-rN4MkxlUWIDI17mJSxyrSB1kPIFvYSXPojXb74RVYYfnd1ICWe5_i1AcEDTs3qviRHmNfwGkyFw_fv6uSQ'
      );

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
