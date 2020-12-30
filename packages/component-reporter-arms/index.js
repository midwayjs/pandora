const { ACMClient } = require('acm-client');
const acm = new ACMClient({
  endpoint: 'acm.aliyun.com',
  namespace: 'c845a7b4-23a1-4f28-a380-5ab30d8a280f',
  accessKey: '*',
  secretKey: '*',
  requestTimeout: 6000,
});
(async function () {
  const dataId = 'arms.trace.b590lhguqs-50914a8fcbf1fc2';
  const group = 'cn-hangzhou';
  const data = await acm.getConfig(dataId, group);
  console.log('get data', JSON.parse(data));
  acm.subscribe({ dataId, group }, data => {
    console.log('subscription', typeof data);
  });
})();
