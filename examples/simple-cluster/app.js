const Koa = require('koa');
const app = new Koa();
app.use(function (ctx) {
  ctx.body = 'Hello Pandora.js';
});
app.listen(3000);
console.log('Listening Port 3000...');
