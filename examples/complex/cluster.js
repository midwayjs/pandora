const http = require('http');
http.createServer((req, res) => {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end('Hello Pandora.js Cluster');
}).listen(4567);
console.log('Cluster Listening Port 4567...');
console.log('gc() at cluster.js', typeof gc);
