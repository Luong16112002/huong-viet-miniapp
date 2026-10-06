import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { healthRoute } from './health-routes.mjs';

test('public HTTP health routes precede 404, query the database and never expose secrets', async () => {
  let connected = true;
  const dependencies = { commerce: {
    debugDatabase() { if (!connected) throw new Error('secret database password'); return true; },
    inventoryStats() { return { tables: 500 }; },
  }, configured: true, model: 'test-model', menuItems: 128 };
  const send = (res, status, body) => {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(body));
  };
  const server = http.createServer((req,res) => {
    if (healthRoute(req,res,send,dependencies)) return;
    send(res,404,{success:false});
  });
  await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    const response = await fetch(base+'/api/health?probe=render');
    assert.equal(response.status,200);
    const health = await response.json();
    assert.equal(health.service,'huong-viet-api');
    assert.equal(health.status,'ok');
    assert.equal(health.database,true);
    assert.ok(Number.isFinite(Date.parse(health.timestamp)));
    for (const path of ['/api/db/health','/api/debug/db'])
      assert.deepEqual(await (await fetch(base+path)).json(),{success:true,connected:true});
    assert.equal((await (await fetch(base+'/api/debug/tables')).json()).count,500);
    assert.equal((await (await fetch(base+'/api/ai/health')).json()).configured,true);
    dependencies.configured=false;
    assert.equal((await (await fetch(base+'/api/ai/health')).json()).configured,false);
    connected=false;
    const failed = await fetch(base+'/api/health');
    assert.equal(failed.status,503);
    const body = await failed.text();
    assert.equal(JSON.parse(body).database,false);
    assert.ok(!body.includes('password'));
    assert.equal((await fetch(base+'/unknown')).status,404);
  } finally { await new Promise(resolve => server.close(resolve)); }
});
