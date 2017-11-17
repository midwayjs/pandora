module.exports = function (pandora) {
  pandora.configurator('./FakeConfigurator');
  pandora.service('./SomeService').name('myVeryOwnService').process('background');
  pandora.service('./DepServiceBABA').process('background');
  pandora.applet('./SomeApplet').name('myVeryOwnApplet').process('background');
  pandora.applet('./ConfigApplet').name('configApplet').process('background').config((context) => {
    return context.config;
  });
};
