const http = require('http');
const server = http.createServer((req, res) => {
  const options = {
    hostname: 'localhost',
    port: 8081,
    path: req.url,
    method: req.method,
    headers: { ...req.headers, host: 'localhost:8081' }
  };
  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });
  req.pipe(proxyReq, { end: true });
  proxyReq.on('error', (err) => {
    res.statusCode = 500;
    res.end();
  });
});
server.listen(8080, () => console.log('Proxy running on 8080, forwarding to 8081 with corrected headers'));
