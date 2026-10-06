import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {Readable} from 'node:stream';
import {createAdmin} from './admin.mjs';
import {seedTables} from './seed-tables.mjs';
import {tablePrefixes} from './table-policy.mjs';
test('bulk area limits and atomic validation',async()=>{
 const db=new DatabaseSync(':memory:');db.exec('CREATE TABLE records(id TEXT,kind TEXT,data TEXT)');const admin=createAdmin(db,{key:'test'});
 async function call(body,key='test'){let result;const req=Readable.from([JSON.stringify(body)]);req.method='POST';req.headers={authorization:'Bearer '+key};await admin.route(req,{},(_,status,data)=>result={status,data},'/api/admin/tables/bulk-create');return result;}
 try{
 assert.equal((await call({},'wrong')).status,401);
 for(const input of [{quantity:501},{quantity:101},{quantity:0},{quantity:1.2},{startNumber:100,quantity:2},{capacity:0},{area:'missing'},{areaAllocation:{}},{areaAllocation:[null]}]){
 assert.equal((await call(input)).status,400,JSON.stringify(input));assert.equal(admin.tables().length,0);
 }
 assert.equal((await call({})).data.created,100);
 assert.equal((await call({})).data.skipped.length,100);
 const result=await call({quantity:500,areaAllocation:Object.keys(tablePrefixes).map(area=>({area,quantity:100}))});
 assert.equal(result.status,200);assert.equal(result.data.created,400);assert.equal(result.data.skipped.length,100);
 for(const [area,prefix] of Object.entries(tablePrefixes)){
 const rows=admin.tables().filter(t=>t.area===area);assert.equal(rows.length,100);assert.ok(rows.some(t=>t.id===prefix+'-100'));
 }
 assert.equal((await call({area:'garden'})).data.skipped.length,100);assert.equal(admin.tables().length,500);
 }finally{db.close()}
});
test('seed idempotency, dry run and legacy overflow protection',()=>{
 const db=new DatabaseSync(':memory:');
 try{
 assert.equal(seedTables(db,{dryRun:true}).created,500);
 assert.equal(seedTables(db).created,500);assert.equal(seedTables(db).created,0);
 for(const prefix of Object.values(tablePrefixes)){
 for(const [n,capacity] of [[1,2],[20,2],[21,4],[50,4],[51,6],[70,6],[71,8],[82,8],[83,10],[90,10],[91,12],[96,12],[97,20],[100,20]]){
 const row=JSON.parse(db.prepare('SELECT data FROM restaurant_tables WHERE id=?').get(prefix+'-'+String(n).padStart(3,'0')).data);assert.equal(row.capacity,capacity);
 }}
 assert.equal(db.prepare('SELECT COUNT(*) n FROM restaurant_tables').get().n,500);
 db.prepare('INSERT INTO restaurant_tables VALUES (?,?)').run('old',JSON.stringify({id:'old',area:'indoor'}));
 assert.throws(()=>seedTables(db),/101/);
 assert.equal(db.prepare('SELECT COUNT(*) n FROM restaurant_tables').get().n,501);
 }finally{db.close()}
});
