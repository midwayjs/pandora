const http = require('http');
http.createServer((req, res) => {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end('Hello Pandora.js Fork');
}).listen(1234);
console.log('Fork Listening Port 1234...');
console.log('gc() at forkApp.js', typeof gc);
