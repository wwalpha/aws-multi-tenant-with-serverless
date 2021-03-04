import request from 'supertest';
import server from '../src/server';

describe('token manager', () => {
  it('get system credentials', (done) => {
    request(server)
      .get('/token/system')
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
