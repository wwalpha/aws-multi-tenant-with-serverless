import axios from 'axios';
import { v4 } from 'uuid';

axios.defaults.baseURL = 'http://localhost:8080';

const testHealthCheck = async () => {
  console.log((await axios.get('/user/health')).data);
};

const testLookupUser = async () => {};

const testRegistTenantAdmin = async () => {
  await axios.post('/user/reg', {
    tenantId: `TENANT${v4().split('-').join('')}`,
  });
};

// testHealthCheck();

testRegistTenantAdmin();
