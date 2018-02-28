module.exports = class ServiceB {
  constructor(context) {
    this.context = context;
  }
  async start() {
    // 或者 require('pandora').getProxy();
    const serviceA = await this.context.getProxy('serviceA');
    const pid = await serviceA.getPid();
    console.log();
    console.log();
    console.log('pid from serviceA', pid);
    console.log('pid from self', process.pid);
    console.log();
    console.log();
  }
  async stop() {
    console.log('ServiceB called stop');
  }
}
