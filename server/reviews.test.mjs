import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createCommerce } from './commerce.mjs';

test('personal reviews: create, retry, list, edit, ownership, validation and delete', async () => {
  const commerce = createCommerce({ filename: ':memory:', menu: [{ id: 1, name: 'Phở bò', price: 79000 }], zalo: { ready: () => false } });
  const server = http.createServer(async (req, res) => {
    const send = (response, status, body) => {
      response.writeHead(status, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify(body));
    };
    if (!await commerce.route(req, res, send)) send(res, 404, {});
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const request = async (path = '', body, owner = 'a', key = 'review-test-00001') => {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/commerce/reviews${path}`, {
      method: body === undefined ? 'GET' : 'POST',
      headers: { Authorization: `Bearer ${owner.repeat(64)}`, 'Content-Type': 'application/json', 'Idempotency-Key': key },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    return { status: response.status, data: await response.json() };
  };
  try {
    const draft = { rating: 5, foodId: 1, content: 'Món ăn rất ngon, phục vụ chu đáo.', tags: ['Món ăn ngon'], images: [], criteria: { food: 5 } };
    const created = await request('', draft);
    assert.equal(created.status, 201);
    assert.equal(created.data.foodName, 'Phở bò');
    assert.equal((await request('', draft)).data.id, created.data.id);
    assert.equal((await request()).data.length, 1);
    assert.deepEqual((await request('', undefined, 'b')).data, []);
    const path = `/${created.data.id}`;
    assert.equal((await request(`${path}/update`, draft, 'b')).status, 404);
    assert.equal((await request(`${path}/delete`, {}, 'b')).status, 404);
    const edited = await request(`${path}/update`, { ...draft, rating: 4, content: 'Không gian đẹp, món ăn vừa miệng.' });
    assert.equal(edited.status, 200);
    assert.equal((await request()).data[0].rating, 4);
    for (const invalid of [{ rating: 0 }, { content: 'ngắn' }, { images: ['invalid'] }, { foodId: 999 }, { criteria: { food: 6 } }]) {
      assert.equal((await request(`${path}/update`, { ...draft, ...invalid })).status, 400);
    }
    assert.equal((await request(`${path}/delete`, {})).status, 200);
    assert.deepEqual((await request()).data, []);
  } finally {
    await new Promise(resolve => server.close(resolve));
    commerce.close();
  }
});
