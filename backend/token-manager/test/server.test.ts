import request from 'supertest';
import server from '../src/server';

describe('token manager', () => {
  beforeAll(() => {});

  afterAll(() => {});

  it('get credentials from user', (done) => {
    request(server)
      .get('/token/user')
      .expect(200)
      .end((err, res) => {
        expect(err).toBeUndefined;
        expect(res.body).toHaveProperty('accessKeyId');
        expect(res.body).toHaveProperty('secretAccessKey');
        expect(res.body).toHaveProperty('sessionToken');

        done();
      });
  });
});
