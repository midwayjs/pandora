module.exports = function (pandora) {

  pandora
    .process('worker')
    .nodeArgs(['--expose-gc']);

  pandora
    .process('background')
    .nodeArgs(['--expose-gc']);

  pandora
    .fork('forkApp', './forkApp.js')
    .nodeArgs(['--expose-gc']);

  pandora
    .cluster('./cluster.js');

  pandora
    .service('backgroundTask', './backgroundTask')
    .process('background')
    .config({ loopInterval: 1000 });

};
