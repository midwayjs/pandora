const http = require('http');
module.exports = class HTTPServer {
  constructor(context) {
    this.config = context.config;
  }
  start () {
    http.createServer((req, res) => {
      res.writeHead(200, {'Content-Type': 'text/plain'});
      res.end('Hello Pandora.js');
    }).listen(this.config.port);
    console.log('Listening Port ' + this.config.port + '...');
  }
  stop () {
    // Do something when stop
    console.log('Stoping');
  }
};
