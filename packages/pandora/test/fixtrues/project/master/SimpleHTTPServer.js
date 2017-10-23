const http = require('http');
const HTTPApplet = require('../../../../dist/application/built-in-applet/HTTPApplet').HTTPApplet;
module.exports = class SomeApplet extends HTTPApplet {
  createServer() {
    return http.createServer((req, res) => {
      res.writeHead(200, {'Content-Type': 'text/plain'});
      res.end('okay');
    });
  }

  getPort() {
    return 1338;
  }
};
