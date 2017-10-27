const http = require('http');
http.createServer((req, res) => {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end('Hello Pandora.js');
}).listen(1338);
console.log('Listening Port 1338...');
