'use strict';

const Controller = require('egg').Controller;

class HomeController extends Controller {
  async index() {
    const { ctx } = this;
    const { data } = await ctx.curl('https://example.com', {
      method: 'GET',
      dataType: 'text',
    });
    if (Math.random() > 0.5) {
      await ctx.curl('https://not-exists', {
        method: 'GET',
        dataType: 'text',
      });
    }
    ctx.body = data;
  }
}

module.exports = HomeController;
