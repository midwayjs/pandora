'use strict';

const Controller = require('egg').Controller;

class HomeController extends Controller {
  async error() {
    throw new Error('foo');
  }

  async badRequest() {
    this.ctx.status = 400;
    this.ctx.body = 'bad request';
  }

  async index() {
    const { ctx } = this;
    ctx.body = 'hello world';
  }
}

module.exports = HomeController;
