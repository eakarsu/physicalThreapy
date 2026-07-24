import http from 'node:http';

const apiPort = Number(process.env.BACKEND_PORT);
const uiPort = Number(process.env.FRONTEND_PORT);
if (!Number.isInteger(apiPort) || !Number.isInteger(uiPort) || apiPort === uiPort) {
  throw new Error('BACKEND_PORT and FRONTEND_PORT must be distinct integer ports');
}

const server = http.createServer((request, response) => {
  if (!request.url?.startsWith('/api/')) {
    response.writeHead(404, { 'content-type': 'application/json' });
    response.end(JSON.stringify({ error: 'Not found' }));
    return;
  }
  const upstream = http.request({
    hostname: '127.0.0.1',
    port: uiPort,
    method: request.method,
    path: request.url,
    headers: { ...request.headers, host: `127.0.0.1:${uiPort}` },
  }, (upstreamResponse) => {
    response.writeHead(upstreamResponse.statusCode || 502, upstreamResponse.headers);
    upstreamResponse.pipe(response);
  });
  upstream.on('error', () => {
    if (!response.headersSent) response.writeHead(502, { 'content-type': 'application/json' });
    response.end(JSON.stringify({ error: 'Application unavailable' }));
  });
  request.pipe(upstream);
});

server.listen(apiPort, '127.0.0.1', () => {
  console.log(`PT Flow API gateway listening on http://127.0.0.1:${apiPort}`);
});

const shutdown = () => server.close(() => process.exit(0));
process.once('SIGTERM', shutdown);
process.once('SIGINT', shutdown);
