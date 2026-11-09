'use strict';
// Local transport proof only. The existing entry retains its demo/emulator guards.
const http = require('node:http');
function createLocalServer(handler) {
  return http.createServer(async (req, res) => {
    const headers = {}, multiValueHeaders = {};
    for (let i = 0; i < req.rawHeaders.length; i += 2) {
      const key = req.rawHeaders[i].toLowerCase();
      (multiValueHeaders[key] ||= []).push(req.rawHeaders[i + 1]);
      headers[key] = req.rawHeaders[i + 1];
    }
    let size = 0;
    const chunks = [];
    try {
      for await (const chunk of req) {
        size += chunk.length;
        if (size > 65536) {
          res.writeHead(413, { 'content-type': 'application/json', 'cache-control': 'no-store' });
          res.end(JSON.stringify({ error: { status: 'INVALID_ARGUMENT' } }));
          return;
        }
        chunks.push(chunk);
      }
      const url = new URL(req.url, 'http://127.0.0.1');
      const result = await handler({
        httpMethod: req.method, path: url.pathname,
        headers, multiValueHeaders,
        body: Buffer.concat(chunks).toString('base64'), isBase64Encoded: true,
        queryStringParameters: Object.fromEntries(url.searchParams),
        multiValueQueryStringParameters: Object.fromEntries(
          [...new Set(url.searchParams.keys())].map(key => [key, url.searchParams.getAll(key)])
        ),
        requestContext: { identity: { sourceIp: req.socket.remoteAddress } }
      });
      const responseHeaders = { ...result.headers, 'cache-control': 'no-store' };
      for (const [key, values] of Object.entries(result.multiValueHeaders || {})) responseHeaders[key] = values;
      res.writeHead(result.statusCode, responseHeaders);
      res.end(result.isBase64Encoded ? Buffer.from(result.body || '', 'base64') : result.body || '');
    } catch {
      if (!res.headersSent) res.writeHead(500, { 'content-type': 'application/json', 'cache-control': 'no-store' });
      res.end(JSON.stringify({ error: { status: 'INTERNAL' } }));
    }
  });
}
if (require.main === module) {
  const port = Number(process.env.LOCAL_NODE_HTTP_PORT || 8788);
  if (!Number.isInteger(port) || port < 1024 || port > 65535) throw Error('Invalid local port');
  const server = createLocalServer(require('./functions/assessment.cjs').handler);
  server.listen(port, '127.0.0.1', () => console.log(`Local proof: http://127.0.0.1:${port}`));
}
module.exports = { createLocalServer };
