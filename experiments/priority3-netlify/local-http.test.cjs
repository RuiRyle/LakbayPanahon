'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { createLocalServer } = require('./local-http.cjs');
async function request(handler, options = {}, body = '') {
  const server = createLocalServer(handler);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    return await new Promise((resolve, reject) => {
      const req = http.request({ hostname: '127.0.0.1', port: server.address().port,
        path: '/.netlify/functions/assessment/submitStudentActivity?a=1&a=2', method: 'POST', ...options }, res => {
        const chunks = [];
        res.on('data', chunk => chunks.push(chunk));
        res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks).toString() }));
      });
      req.on('error', reject); req.end(body);
    });
  } finally { await new Promise(resolve => server.close(resolve)); }
}
test('preserves callable body, route, repeated query and duplicate credential evidence', async () => {
  const result = await request(async event => {
    assert.equal(event.path, '/.netlify/functions/assessment/submitStudentActivity');
    assert.equal(Buffer.from(event.body, 'base64').toString(), '{"data":{"id":"synthetic"}}');
    assert.deepEqual(event.multiValueQueryStringParameters.a, ['1', '2']);
    assert.deepEqual(event.multiValueHeaders.authorization, ['Bearer one', 'Bearer two']);
    return { statusCode: 400, body: '{"error":{"status":"INVALID_ARGUMENT"}}' };
  }, { headers: ['Host', '127.0.0.1', 'Authorization', 'Bearer one', 'Authorization', 'Bearer two'] }, '{"data":{"id":"synthetic"}}');
  assert.equal(result.status, 400);
  assert.equal(result.headers['cache-control'], 'no-store');
});
test('rejects oversized requests before invoking backend', async () => {
  let called = false;
  const result = await request(async () => { called = true; }, {}, 'x'.repeat(65537));
  assert.equal(result.status, 413); assert.equal(called, false);
});
test('does not expose internal exception details', async () => {
  const result = await request(async () => { throw Error('secret-canary'); });
  assert.equal(result.status, 500); assert.equal(result.body.includes('secret-canary'), false);
});
test('preserves preflight method and encoded response', async () => {
  const result = await request(async event => {
    assert.equal(event.httpMethod, 'OPTIONS');
    return { statusCode: 200, headers: { 'access-control-allow-origin': 'http://localhost' },
      body: Buffer.from('ok').toString('base64'), isBase64Encoded: true };
  }, { method: 'OPTIONS' });
  assert.equal(result.body, 'ok'); assert.equal(result.headers['access-control-allow-origin'], 'http://localhost');
});
test('actual Firebase callable rejects unsigned and ambiguous credentials over HTTP', async () => {
  process.env.GCLOUD_PROJECT = 'demo-lakbaypanahon';
  process.env.FIREBASE_CONFIG = JSON.stringify({ projectId: 'demo-lakbaypanahon' });
  process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8180';
  process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
  delete process.env.FUNCTIONS_EMULATOR;
  const { handler } = require('./functions/assessment.cjs');
  for (const name of ['startStudentAssessment', 'advanceStudentAssessment', 'resumeStudentAssessment', 'submitStudentActivity']) {
    const result = await request(handler, { path: '/.netlify/functions/assessment/' + name,
      headers: { 'content-type': 'application/json' } }, '{"data":{}}');
    assert.equal(result.status, 401, name);
    assert.equal(JSON.parse(result.body).error.status, 'UNAUTHENTICATED');
  }
  const duplicate = await request(handler, { headers: ['Host', '127.0.0.1',
    'Authorization', 'Bearer one', 'Authorization', 'Bearer two'] }, '{"data":{}}');
  assert.equal(duplicate.status, 400);
});
