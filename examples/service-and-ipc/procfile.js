module.exports = function (pandora) {

  // 定义两个进程
  pandora
    .process('a')
    .scale(1);
  pandora
    .process('b')
    .scale(1);

  // 定义 ServiceA 在 进程 a ，并且发布至 IPC-Hub
  pandora
    .service('serviceA', './ServiceA')
    .process('a')
    .publish();

  // 定义 ServiceB 在进程 b
  pandora
    .service('serviceB', './ServiceB')
    .process('b');

}
