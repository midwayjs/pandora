module.exports = function (pandora) {
  pandora.applet('./applet').config((ctx) => {
    return ctx.config.http;
  });
};
