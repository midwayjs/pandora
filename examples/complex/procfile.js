module.exports = function (pandora) {

  pandora
    .process('worker')
    .argv(['--expose-gc']);

  pandora
    .process('background')
    .argv(['--expose-gc']);

  pandora
    .fork('./forkApp.js', 'forkApp')
    .argv(['--expose-gc']);

  pandora
    .cluster('./cluster.js');

  pandora
    .applet('./backgroundTask')
    .process('background')
    .config((ctx) => {
      return ctx.config.background;
    });

};
