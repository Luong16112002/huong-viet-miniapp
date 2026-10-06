import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {migrateInventory} from './migrate-table-inventory.mjs';
test('migration preserves references, status, capacity distribution and is repeatable',()=>{
 const db=new DatabaseSync(':memory:');db.exec('CREATE TABLE restaurant_tables(id TEXT PRIMARY KEY,data TEXT);CREATE TABLE records(id TEXT PRIMARY KEY,data TEXT)');
 for(let i=1;i<=201;i++){const id='T'+String(i).padStart(3,'0');db.prepare('INSERT INTO restaurant_tables VALUES(?,?)').run(id,JSON.stringify({id,area:'indoor',capacity:4,active:true,status:i===2?'RESERVED':'AVAILABLE'}));}
 db.prepare('INSERT INTO records VALUES(?,?)').run('booking',JSON.stringify({tableId:'T002',area:'indoor',guests:6,status:'confirmed'}));
 assert.equal(migrateInventory(db).total,500);assert.equal(db.prepare('SELECT COUNT(*) n FROM restaurant_tables').get().n,201);
 const result=migrateInventory(db,{dryRun:false});assert.equal(result.updatedRecords,1);
 const b=JSON.parse(db.prepare('SELECT data FROM records').get().data), t=JSON.parse(db.prepare('SELECT data FROM restaurant_tables WHERE id=?').get(b.tableId).data);
 assert.ok(t.capacity>=6);assert.equal(t.status,'RESERVED');assert.equal(b.area,t.area);
 assert.equal(migrateInventory(db,{dryRun:false}).updatedRecords,0);
 for(const area of ['indoor','garden','private','floor1','floor2']){
 const rows=db.prepare('SELECT data FROM restaurant_tables').all().map(r=>JSON.parse(r.data)).filter(t=>t.area===area);assert.equal(rows.length,100);
 assert.deepEqual([2,4,6,8,10,12,20].map(n=>rows.filter(t=>t.capacity===n).length),[20,30,20,12,8,6,4]);
 }db.close();
});
