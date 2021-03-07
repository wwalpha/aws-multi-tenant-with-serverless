import request from 'supertest';
import app from '../src/server';

describe('tenant registry', () => {
  it('health check', (done) => {
    request(app)
      .get('/reg/health')
      .expect(200)
      .end((err, res) => {
        console.log(res.body);

        expect(err).toBeUndefined;
        expect(res.body).toMatchObject({
          service: 'Tenant Registration',
          isAlive: true,
        });

        done();
      });
  });

  it('tenant regist', (done) => {
    request(app)
      .post('/reg')
      .expect(200)
      .end((err, res) => {
        console.log(res.body);

        expect(err).toBeUndefined;
        expect(res.body).toMatchObject({
          service: 'Tenant Registration',
          isAlive: true,
        });

        done();
      });
  });
});
