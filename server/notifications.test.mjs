import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { createNotificationRoutes } from './notifications.mjs';
test('notifications reflect real records, isolate owners and persist read/delete state',async()=>{
 const db=new DatabaseSync(':memory:');db.exec('CREATE TABLE records(owner TEXT,kind TEXT,data TEXT)');
 db.prepare('INSERT INTO records VALUES(?,?,?)').run('alice','order',JSON.stringify({id:'order-1',state:'pending',orderCode:'HV1',createdAt:'2026-09-22T03:00:00Z'}));
 const route=createNotificationRoutes(db);
 async function call(owner,path='/api/notifications',method='GET'){let result;await route({method},{},(_r,status,data)=>{result={status,data};},owner,path);return result;}
 try{
 const first=await call('alice');assert.equal(first.data.length,1);assert.equal(first.data[0].isRead,false);assert.match(first.data[0].message,/chờ xác nhận/);assert.equal((await call('bob')).data.length,0);
 const path='/api/notifications/'+encodeURIComponent(first.data[0].id);
 assert.equal((await call('bob',path+'/read','PUT')).status,404);
 assert.equal((await call('alice',path+'/read','PUT')).status,200);assert.equal((await call('alice')).data[0].isRead,true);
 await call('alice',path,'DELETE');assert.equal((await call('alice')).data.length,0);
 db.prepare('UPDATE records SET data=?').run(JSON.stringify({id:'order-1',state:'confirmed',orderCode:'HV1',createdAt:'2026-09-22T03:00:00Z',updatedAt:'2026-09-22T04:00:00Z'}));
 assert.equal((await call('alice')).data.length,1);await call('alice','/api/notifications/read-all','PUT');assert.equal((await call('alice')).data[0].isRead,true);
 assert.equal((await call('alice','/api/notifications/read-all','POST')).status,405);
 }finally{db.close();}
});
