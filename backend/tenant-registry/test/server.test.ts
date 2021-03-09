import request from 'supertest';
import app from '../src/server';

describe('tenant registry', () => {
  it('health check', async () => {
    const res = await request(app).get('/reg/health');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      service: 'Tenant Registration',
      isAlive: true,
    });
  });

  it('tenant regist', async () => {
    const res = await request(app).post('/reg');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      service: 'Tenant Registration',
      isAlive: true,
    });
  });
});
