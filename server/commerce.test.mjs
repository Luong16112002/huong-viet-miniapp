import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createCommerce } from './commerce.mjs';
import { createZaloService } from './zalo-service.mjs';

const env = { ZALO_APP_SECRET:'test-secret', ZALO_OA_ACCESS_TOKEN:'test-token', ZALO_ORDER_TEMPLATE_ID:'123', ZALO_RESERVATION_TEMPLATE_ID:'456' };
const proof = { accessToken:'user-token', phoneToken:'one-time-code' };
const identity = () => Response.json({error:0,data:{number:'84901234567'}});
for (const [name, result, expected] of [
  ['API success', {error:0,data:{msg_id:'actual-id'}}, 'accepted'],
  ['permission denied', {error:-124}, 'pending'],
  ['missing message ID', {error:0,data:{}}, 'pending'],
  ['string error code', {error:'0',data:{msg_id:'id'}}, 'pending'],
]) test(name, async()=>{
  const calls=[];
  const service=createZaloService(env,async(url,options)=>{calls.push({url,options});return url.includes('/me/info')?identity():Response.json(result);});
  const record={id:'abc-123',orderCode:'HV-test',totalAmount:79000};
  assert.equal((await service.send('order',record,proof)).status,expected);
  const body=JSON.parse(calls[1].options.body);
  assert.equal(body.phone,'84901234567');
  assert.equal(body.template_id,'123');
  assert.equal(body.template_data.status,'Đã ghi nhận, đang chờ xác nhận');
});
test('no config, no proof, identity denial and network failure never claim success',async()=>{
  const never=()=>{throw new Error('should not call');};
  assert.equal((await createZaloService({},never).send('order',{},proof)).reason,'not_configured');
  assert.equal((await createZaloService(env,never).send('order',{})).reason,'recipient_unverified');
  assert.equal((await createZaloService(env,async()=>Response.json({error:-1})).send('order',{},proof)).reason,'recipient_unverified');
  assert.equal((await createZaloService(env,never).send('order',{},proof)).status,'pending');
  const badHTTP=createZaloService(env,async url=>url.includes('/me/info')?identity():Response.json({error:0,data:{msg_id:'id'}},{status:503}));
  assert.equal((await badHTTP.send('order',{id:'test'},proof)).status,'pending');
});
test('durable records, idempotency, owner isolation, validation, cancellation and provider failure',async()=>{
  const directory=mkdtempSync(join(tmpdir(),'huong-viet-commerce-'));
  const filename=join(directory,'test.sqlite');
  let attempts=0;
  const options={ filename,menu:[{id:1,name:'Bò nướng',price:79000}],zalo:{ready:()=>true,send:async()=>{attempts++;throw new Error('provider offline');}} };
  let commerce=createCommerce(options);
  const server=http.createServer(async(req,res)=>{
    const send=(r,status,body)=>{r.writeHead(status,{'Content-Type':'application/json'});r.end(JSON.stringify(body));};
    if(!await commerce.route(req,res,send)) send(res,404,{});
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base=`http://127.0.0.1:${server.address().port}/api/commerce/`;
  const request=async(path,body,key='1234567890abcdef',owner='a'.repeat(64))=>{
    const response=await fetch(base+path,{method:body===undefined?'GET':'POST',headers:{Authorization:`Bearer ${owner}`,'Idempotency-Key':key,'Content-Type':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)})});
    return {status:response.status,data:await response.json()};
  };
  try {
    const draft={deliveryType:'pickup',items:[{productId:1,quantity:2,price:1}],paymentMethod:'zalopay'};
    const created=await request('orders',draft);
    assert.equal(created.status,201);assert.equal(created.data.totalAmount,158000);assert.equal(created.data.payment.status,'pending');assert.equal(created.data.notification.status,'pending');
    assert.equal((await request('orders',draft)).data.id,created.data.id);assert.equal(attempts,1);
    assert.equal((await request('orders',{...draft,note:'changed'})).status,400);
    assert.deepEqual((await request('orders',undefined,undefined,'b'.repeat(64))).data,[]);
    assert.equal((await request(`orders/${created.data.id}`,undefined,undefined,'b'.repeat(64))).status,404);
    assert.equal((await request('orders',{...draft,expectedTotal:1},'badprice123456789')).status,400);
    assert.equal((await request('orders',{...draft,items:[{productId:1,quantity:-1}]},'badquantity123456')).status,400);
    commerce.close();commerce=createCommerce(options);
    assert.equal((await request('orders')).data.length,1);
    assert.equal((await request(`orders/${created.data.id}/cancel`,{})).data.state,'cancelled');
    const tomorrow=new Date(Date.now()+86400000).toISOString().slice(0,10);
    const reservation={date:tomorrow,time:'18:00',guests:2,area:'indoor',name:'Khách thử',phone:'0901234567'};
    const booking=await request('reservations',reservation);
    assert.equal(booking.status,201);assert.equal(booking.data.status,'pending');
    assert.equal((await request('reservations',reservation)).data.id,booking.data.id);
    assert.equal((await request('reservations',reservation,'duplicatebooking123')).status,400);
    assert.equal((await request(`reservations/${booking.data.id}/cancel`,{})).data.status,'cancelled');
    assert.equal((await request('orders',undefined,undefined,'invalid')).status,401);
  } finally {await new Promise(resolve=>server.close(resolve));commerce.close();rmSync(directory,{recursive:true});}
});


test('cart quote matches saved dine-in order and requires table information',async()=>{
 const commerce=createCommerce({filename:':memory:',adminKey:'test-admin-key',menu:[{id:1,name:'Phở gà',price:59000}],vouchers:[{code:'TEST10',enabled:true,amount:10000,minSubtotal:50000}],zalo:{ready:()=>false,send:async()=>({status:'pending'})}});
 const server=http.createServer(async(req,res)=>{await commerce.route(req,res,(r,status,data)=>{r.writeHead(status,{'Content-Type':'application/json'});r.end(JSON.stringify(data));});});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const request=async(path,input,key)=>{const r=await fetch('http://127.0.0.1:'+server.address().port+'/api/commerce/'+path,{method:'POST',headers:{Authorization:'Bearer '+'a'.repeat(64),'Content-Type':'application/json','Idempotency-Key':key||'cart-test-123456789'},body:JSON.stringify(input)});return {status:r.status,data:await r.json()};};
 try {
  const setup=await fetch('http://127.0.0.1:'+server.address().port+'/api/admin/tables',{method:'POST',headers:{Authorization:'Bearer test-admin-key','Content-Type':'application/json'},body:JSON.stringify({id:'IN-005',name:'Table 05',area:'indoor',capacity:4,status:'AVAILABLE'})});assert.equal(setup.status,200);
  const draft={deliveryType:'dinein',tableNumber:'IN-005',items:[{productId:1,quantity:2,note:'Không hành'}],note:'Mang món cùng lúc',voucherCode:'TEST10',paymentMethod:'cash'};
  const quote=await request('cart/quote',draft);assert.equal(quote.status,200);assert.equal(quote.data.total,108000);
  const saved=await request('orders',{...draft,expectedTotal:quote.data.total});assert.equal(saved.status,201);assert.equal(saved.data.tableNumber,'IN-005');assert.equal(saved.data.deliveryType,'dinein');assert.equal(saved.data.payment.discount,10000);assert.equal(saved.data.items[0].note,'Không hành');assert.equal(saved.data.note,'Mang món cùng lúc');
  const adminUpdate=await fetch('http://127.0.0.1:'+server.address().port+'/api/admin/orders/'+saved.data.id+'/status',{method:'PUT',headers:{Authorization:'Bearer test-admin-key','Content-Type':'application/json'},body:JSON.stringify({status:'CONFIRMED'})});assert.equal(adminUpdate.status,200);
  const customerView=await fetch('http://127.0.0.1:'+server.address().port+'/api/commerce/orders/'+saved.data.id,{headers:{Authorization:'Bearer '+'a'.repeat(64)}});assert.equal((await customerView.json()).state,'confirmed');
  assert.equal((await request('orders',{...draft,tableNumber:''},'missing-table-123456')).status,400);
  assert.equal((await request('orders',{...draft,expectedTotal:1},'wrong-total-12345678')).status,400);
  assert.equal((await request('cart/quote',{...draft,voucherCode:'FAKE'})).status,400);
 } finally {await new Promise(resolve=>server.close(resolve));commerce.close();}
});
