module.exports = function (pandora) {

  pandora
    .process('worker')
    .argv(['--expose-gc']);

  pandora
    .process('background')
    .argv(['--expose-gc']);

  pandora
    .fork('forkApp', './forkApp.js')
    .argv(['--expose-gc']);

  pandora
    .cluster('./cluster.js');

  pandora
    .service('backgroundTask', './backgroundTask')
    .process('background')
    .config({ loopInterval: 1000 });

};
