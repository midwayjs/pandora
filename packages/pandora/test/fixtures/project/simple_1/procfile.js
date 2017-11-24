console.log('PLS KEEP THIS LOG FOR https://github.com/midwayjs/pandora/issues/24');
module.exports = function (pandora) {
  pandora.configurator('./FakeConfigurator');
  pandora.service('./SomeService').name('myVeryOwnService').process('background');
  pandora.service('./DepServiceBABA').process('background');
  pandora.applet('./SomeApplet').name('myVeryOwnApplet').process('background');
  pandora.applet('./ConfigApplet').name('configApplet').process('background').config((context) => {
    return context.config;
  });
};
