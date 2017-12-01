module.exports = function (pandora) {
  pandora.service('simpleHTTPServer', './SimpleHTTPServer').process('worker');
};
