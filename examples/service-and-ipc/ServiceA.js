export class ServiceA {
  async getPid() {
    return process.pid;
  }
  async stop() {
    console.log('ServiceA called stop');
  }
}
