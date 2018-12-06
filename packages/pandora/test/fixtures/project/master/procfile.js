module.exports = function (pandora) {
  pandora.cluster('worker', './SimpleHTTPServer');
};
