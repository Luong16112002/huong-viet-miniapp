import test from 'node:test';
import assert from 'node:assert/strict';
import {Readable} from 'node:stream';
import {createCommerce} from './commerce.mjs';
import {bookingRoute} from './booking-api.mjs';
test('shared inventory filters, conflict protection, boundary times and cancellation',async()=>{
 const commerce=createCommerce({menu:[],filename:':memory:',adminKey:'test',zalo:{ready:()=>false,send:async()=>({status:'pending'})}});
 async function call(path,body,owner='a',key='request-1234567890'){let result;const req=Readable.from(body===undefined?[]:[JSON.stringify(body)]);req.method=body===undefined?'GET':'POST';req.url=path;req.headers={authorization:'Bearer '+(path.includes('/admin/')?'test':owner.repeat(64)),'idempotency-key':key};const send=(_,status,data)=>result={status,data};if(!await bookingRoute(req,{},send,commerce.availability,commerce.availableTables))await commerce.route(req,{},send);return result}
 try{
 await call('/api/admin/tables/bulk-create',{quantity:3,capacity:4});await call('/api/admin/tables/bulk-create',{quantity:1,prefix:'V',capacity:6,area:'private'});
 const date=new Date(Date.now()+86400000).toISOString().slice(0,10),input={date,time:'18:30',guests:4,area:'indoor'};
 assert.equal((await call('/api/bookings/available-tables',input)).data.count,3);assert.equal((await call('/api/bookings/available-tables',{...input,guests:6})).data.count,0);
 const small=await call('/api/commerce/reservations',{...input,guests:6,tableId:'IN-001',name:'Khách',phone:'0901234567'},'e');
 assert.equal(small.status,409);assert.equal(small.data.code,'TABLE_TOO_SMALL');
 const privateTables=(await call('/api/bookings/available-tables',{...input,area:'private',guests:6})).data.tables;
 assert.equal(privateTables.length,1);assert.equal(privateTables[0].code,'PR-001');assert.equal(privateTables[0].area,'private');
 const draft={...input,tableId:'IN-001',name:'Khách thử',phone:'0901234567'};
 const first=await call('/api/commerce/reservations',draft);assert.equal(first.status,201);assert.equal(first.data.tableId,'IN-001');assert.equal(first.data.durationMinutes,120);
 assert.equal((await call('/api/commerce/reservations',draft,'b')).status,409);
 assert.equal((await call('/api/bookings/available-tables',input)).data.count,2);
 assert.equal((await call('/api/bookings/available-tables',{...input,time:'20:00'})).data.count,2);
 assert.equal((await call('/api/bookings/available-tables',{...input,time:'20:30'})).data.count,3);
 assert.equal((await call('/api/commerce/reservations',{...draft,tableId:'PR-001'},'c')).status,409);
 assert.equal((await call('/api/commerce/reservations/'+first.data.id+'/cancel',{})).status,200);
 assert.equal((await call('/api/bookings/available-tables',input)).data.count,3);
 const auto=await call('/api/commerce/reservations',{...draft,tableId:null,autoAssignTable:true},'d');assert.equal(auto.status,201);assert.ok(auto.data.tableId);
 }finally{commerce.close()}
});
