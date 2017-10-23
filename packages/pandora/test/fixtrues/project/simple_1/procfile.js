module.exports = function (pandora) {
  pandora.configurator('./FakeConfigurator');
  pandora.service('./SomeService').name('myVeryOwnService').category('background');
  pandora.service('./DepServiceBABA').category('background');
  pandora.applet('./SomeApplet').name('myVeryOwnApplet').category('background');
  pandora.applet('./ConfigApplet').name('configApplet').category('background').config((context) => {
    return context.config;
  });
};
