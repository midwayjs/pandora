module.exports = function (pandora) {
  pandora.configurator('./FakeConfigurator');
  pandora.applet('./SimpleHTTPServer').process('worker');
};
