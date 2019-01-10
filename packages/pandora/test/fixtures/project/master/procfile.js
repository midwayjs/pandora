module.exports = function (pandora) {
  pandora.cluster('worker', './SimpleHTTPServer').scale(3);
};
