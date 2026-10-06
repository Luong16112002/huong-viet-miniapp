import test from 'node:test';
import assert from 'node:assert/strict';
import { corsHeaders } from './cors.mjs';
test('CORS reflects allowed origins with credentials and rejects other origins', () => {
  const headers = corsHeaders('https://h5.zdn.vn', 'https://h5.zdn.vn,https://mini.zalo.me');
  assert.equal(headers['Access-Control-Allow-Origin'], 'https://h5.zdn.vn');
  assert.equal(headers['Access-Control-Allow-Credentials'], 'true');
  for (const method of ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'])
    assert.ok(headers['Access-Control-Allow-Methods'].includes(method));
  assert.equal(corsHeaders('https://other.example', 'https://h5.zdn.vn'), null);
  assert.equal(corsHeaders(undefined, 'https://h5.zdn.vn')['Access-Control-Allow-Origin'], undefined);
});
