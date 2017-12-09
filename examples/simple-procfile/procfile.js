module.exports = function (pandora) {
  pandora.service('httpServer', './httpServer').config((ctx) => {
    return { port: 1342 };
  });
};
