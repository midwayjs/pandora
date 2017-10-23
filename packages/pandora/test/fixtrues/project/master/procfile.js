module.exports = function (pandora) {
  pandora.configurator('./FakeConfigurator');
  pandora.applet('./SimpleHTTPServer').category('worker');
};
