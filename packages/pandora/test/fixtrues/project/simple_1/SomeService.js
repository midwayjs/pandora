class SomeService {
  start() {
    // console.log('start');
  }
  stop() {
    // console.log('stop');
  }
}
SomeService.dependencies = ['depServiceBABA'];
module.exports = SomeService;
