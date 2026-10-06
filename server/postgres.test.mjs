import test from 'node:test';
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import { mkdtempSync, rmSync, rmdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { seedTables } from './seed-tables.mjs';
import { PostgresDatabase } from './postgres-database.mjs';
import { createCommerce } from './commerce.mjs';
import { createFoodRepository } from './food-repository.mjs';
import { readSQLiteDataset, migrateDataset } from './migrate-postgres.mjs';

test('PostgreSQL stores inventory, catalog and transactional booking lifecycle', async () => {
  const db = new PostgresDatabase(undefined, { testMode: true });
  const menu = [{id:1,name:'Pho',price:59000,category:'Món chính',categoryId:'main-dish',description:'Pho',features:[],variantGroups:[],available:true}];
  try {
    const foods = createFoodRepository(menu, undefined, db);
    assert.equal(foods.getById(1).price,59000);
    const commerce = createCommerce({ database:db, menu, vouchers:[], adminKey:'test-admin-key', zalo:{ send:async()=>({status:'pending'}) } });
    assert.equal(commerce.debugDatabase(),true);
    assert.equal(commerce.listTables().length,500);
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate()+1);
    const date = new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Ho_Chi_Minh'}).format(tomorrow);
    const input = {date,time:'18:30',guests:2,area:'indoor'};
    const table = commerce.availableTables(input)[0];
    assert.ok(table.id.startsWith('IN-'));
    async function call(path, method, body, key='student-booking-123456') {
      const req=Readable.from([JSON.stringify(body)]);req.url=path;req.method=method;req.headers={authorization:'Bearer '+'a'.repeat(64),'idempotency-key':key};
      let result;await commerce.route(req,{},(_res,status,data)=>{result={status,data}});return result;
    }
    const booking = await call('/api/commerce/reservations','POST',{...input,name:'Student',phone:'0901234567',selectedTableId:table.id});
    assert.equal(booking.status,201);
    assert.equal(booking.data.tableId,table.id);
    assert.ok(!commerce.availableTables(input).some(row=>row.id===table.id));
    const again=await call('/api/commerce/reservations','POST',{...input,name:'Student',phone:'0901234567',selectedTableId:table.id});
    assert.equal(again.status,200);assert.equal(again.data.id,booking.data.id);
    assert.equal(db.prepare('SELECT COUNT(*) AS count FROM bookings').get().count,1);
    assert.equal(db.prepare('SELECT COUNT(*) AS count FROM customers').get().count,1);
  } finally { db.close(); }
});

test('SQLite migration preserves all source rows and reruns without duplicates', () => {
  const directory=mkdtempSync(join(tmpdir(),'huong-viet-pg-test-'));
  const commerceFile=join(directory,'commerce.sqlite'), foodFile=join(directory,'foods.sqlite');
  const menu=[{id:1,name:'Pho',price:59000,category:'main',description:'Pho',features:[],variantGroups:[],available:true}];
  const sourceCommerce=createCommerce({filename:commerceFile,menu,vouchers:[],adminKey:'test-admin-key'});
  sourceCommerce.close();
  const sourceFoods=createFoodRepository(menu,foodFile);
  sourceFoods.close();
  const source=new DatabaseSync(commerceFile);
  seedTables(source);
  source.close();
  const datasets=readSQLiteDataset([commerceFile,foodFile]);
  const db=new PostgresDatabase(undefined,{testMode:true});
  try {
    const result=migrateDataset(db,datasets);
    assert.equal(db.prepare('SELECT COUNT(*) AS count FROM tables').get().count,500);
    for(const table of datasets) {
      for(const row of table.rows) {
        const pk=table.columns.filter(c=>c.pk).sort((a,b)=>a.pk-b.pk).map(c=>c.name);
        const saved=db.prepare(`SELECT * FROM ${table.name} WHERE ${pk.map(k=>`${k}=?`).join(' AND ')}`).get(...pk.map(k=>row[k]));
        for(const key of Object.keys(row)) assert.equal(String(saved[key]),String(row[key]));
      }
    }
    const second=migrateDataset(db,datasets);
    assert.deepEqual(second.counts,result.counts);
    assert.equal(second.seed.created,0);
  } finally {
    db.close();
    for (const file of [commerceFile,foodFile])
      for (const suffix of ['', '-wal', '-shm']) rmSync(file+suffix,{force:true});
    rmdirSync(directory);
  }
});
