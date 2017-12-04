
  'use strict';

module.exports = (pandora) => {

  /**
   * default is fork mode
   */
  pandora
    .fork('undefined', 'pandora');

  /**
   * you can use cluster mode to start application
   */
  // pandora
  //   .cluster('./cluster.js');

  /**
   * you can create another process here
   */
  // pandora
  //   .process('background')
  //   .argv(['--expose-gc']);

  /**
   * more features please visit our document.
   * https://github.com/midwayjs/pandora/
   */

};