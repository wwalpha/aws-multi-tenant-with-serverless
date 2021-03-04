import { DynamodbHelper } from 'dynamodb-helper';
import request from 'supertest';
import server from '../src/server';
import { Environments } from '../src/utils';
import { Tables } from 'typings';

describe('tenant', () => {
  it('healthCheck success', (done) => {
    request(server)
      .get('/tenant/health')
      .expect(200)
      .end((err, res) => {
        // except success
        expect(res.body).toMatchObject({ service: 'Tenant Manager', isAlive: true });
        done();
      });
  });

  // regist tenant
  it('create a tenant', (done) => {
    const tenantId = 'TENANT1234567890';

    request(server)
      .post(`/tenant/${tenantId}`)
      .send(require('./datas/A001.Request.json'))
      .set('Content-Type', 'application/json')
      .expect(200)
      .end(async (err, res) => {
        // result
        expect(err).toBeUndefined;
        expect(res.body).toMatchObject({ status: 'success' });

        const helper = new DynamodbHelper();

        const result = await helper.get({
          TableName: Environments.TABLE_NAME_TENANT,
          Key: {
            id: tenantId,
          } as Tables.TenantKey,
        });

        expect(result?.Item).toMatchObject(require('./datas/A001.Response.json'));

        done();
      });
  });

  // update tenant
  it.skip('update tenant', (done) => {
    const tenantId = 'TENANT1234567890';

    request(server)
      .put(`/tenant/${tenantId}`)
      .send(require('./datas/A002.Request.json'))
      .set('Content-Type', 'application/json')
      .expect(200)
      .end(async (err, res) => {
        console.log(err, res.body);
        // error
        expect(err).toBeUndefined;
        // result
        expect(res.body).toMatchObject(require('./datas/A002.Response.json'));

        done();
      });
  });

  // delete tenant
  it('delete tenant', (done) => {
    const tenantId = 'TENANT1234567890';

    request(server)
      .post(`/tenant/${tenantId}`)
      .send(require('./datas/A003.Request.json'))
      .set('Content-Type', 'application/json')
      .expect(200)
      .end(async (err, res) => {
        // result
        expect(err).toBeUndefined;
        expect(res.body).toMatchObject({ status: 'success' });

        const helper = new DynamodbHelper();

        const result = await helper.get({
          TableName: Environments.TABLE_NAME_TENANT,
          Key: {
            id: tenantId,
          } as Tables.TenantKey,
        });

        expect(result?.Item).toBeUndefined;

        done();
      });
  });
});
