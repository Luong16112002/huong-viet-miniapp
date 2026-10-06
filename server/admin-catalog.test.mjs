import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {Readable} from 'node:stream';
import {createAdmin} from './admin.mjs';
import {priceCart} from './cart-pricing.mjs';
test('catalog authentication, validation, persistence and pricing use the same menu',async()=>{
 const db=new DatabaseSync(':memory:');db.exec('CREATE TABLE records(id TEXT,kind TEXT,data TEXT)');const menu=[{id:1,name:'Phở',price:65000,category:'Món chính',available:true}],vouchers=[];const admin=createAdmin(db,{key:'test-key',menu,vouchers});
 async function call(path,method='GET',body={},key='test-key'){let result;const req=Readable.from(method==='GET'?[]:[JSON.stringify(body)]);req.method=method;req.headers={authorization:'Bearer '+key};await admin.route(req,{},(_,status,data)=>result={status,data},'/api/admin'+path);return result}
 try{
 assert.equal((await call('/menu','POST',{},'wrong')).status,401);
 assert.equal((await call('/menu/1','PUT',{price:-1})).status,400);assert.equal(menu[0].price,65000);
 assert.equal((await call('/menu/1','PUT',{price:70000})).status,200);assert.equal(menu[0].price,70000);
 const cart={deliveryType:'pickup',items:[{productId:1,quantity:1}]};assert.equal(priceCart(menu,cart).total,70000);
 assert.equal((await call('/menu/1','PUT',{available:false})).status,200);assert.throws(()=>priceCart(menu,cart));
 assert.equal((await call('/menu','POST',{name:'Trà',category:'Đồ uống',price:20000})).status,200);assert.equal(menu[1].categoryId,'drink');
 const voucher={code:'TEST10',name:'Giảm thử',amount:10000,minSubtotal:0,expiresAt:'2099-12-31T00:00:00Z',enabled:true};assert.equal((await call('/promotions','POST',voucher)).status,200);assert.equal((await call('/promotions','POST',voucher)).status,400);
 assert.equal(priceCart(menu,{deliveryType:'pickup',items:[{productId:2,quantity:1}],voucherCode:'TEST10'},vouchers).total,10000);
 const reloaded=[],reloadedVouchers=[];createAdmin(db,{key:'test-key',menu:reloaded,vouchers:reloadedVouchers});assert.equal(reloaded.find(p=>p.id===1).available,false);assert.equal(reloadedVouchers.length,1);
 assert.equal((await call('/menu/2','DELETE')).status,200);assert.equal((await call('/menu')).data.length,1);assert.throws(()=>priceCart(menu,{deliveryType:'pickup',items:[{productId:2,quantity:1}]}));
 }finally{db.close()}
});
test('promotion duplicate error and optional scheduling preserve fixed-amount pricing', async () => {
 const db=new DatabaseSync(':memory:');db.exec('CREATE TABLE records(id TEXT,kind TEXT,data TEXT)');
 const menu=[{id:1,name:'Phở',price:65000}],vouchers=[];
 const admin=createAdmin(db,{key:'test-key',menu,vouchers});
 async function call(path,method='GET',body={}){let result;const req=Readable.from(method==='GET'?[]:[JSON.stringify(body)]);req.method=method;req.headers={authorization:'Bearer test-key'};await admin.route(req,{},(_,status,data)=>result={status,data},'/api/admin'+path);return result}
 try {
  const voucher={code:' schedule10 ',name:'Giảm theo lịch',amount:10000,minSubtotal:50000,startsAt:'2099-01-01T00:00:00+07:00',expiresAt:'2099-03-01T23:59:59+07:00',enabled:true};
  assert.equal((await call('/promotions','POST',voucher)).status,200);
  assert.equal(vouchers[0].startsAt,voucher.startsAt);
  const duplicate=await call('/promotions','POST',voucher);
  assert.equal(duplicate.status,400);assert.equal(duplicate.data.success,false);assert.equal(duplicate.data.code,'PROMO_CODE_EXISTS');assert.equal(vouchers.length,1);
  const cart={deliveryType:'pickup',items:[{productId:1,quantity:1}],voucherCode:'SCHEDULE10'};
  assert.throws(()=>priceCart(menu,cart,vouchers,Date.parse('2098-12-31T00:00:00Z')));
  assert.equal(priceCart(menu,cart,vouchers,Date.parse('2099-02-01T00:00:00Z')).discount,10000);
  assert.equal((await call('/promotions/SCHEDULE10','PUT',{startsAt:'2099-04-01T00:00:00Z'})).status,400);
  assert.equal(vouchers[0].startsAt,voucher.startsAt);
  assert.equal((await call('/promotions/SCHEDULE10','PUT',{startsAt:null})).status,200);
  assert.equal(vouchers[0].startsAt,undefined);
  assert.equal(priceCart(menu,cart,vouchers,Date.parse('2098-12-31T00:00:00Z')).discount,10000);
  const reloaded=[];createAdmin(db,{key:'test-key',menu:[],vouchers:reloaded});assert.equal(reloaded[0].startsAt,undefined);
  assert.equal((await call('/promotions/SCHEDULE10','PUT',{enabled:false})).status,200);assert.throws(()=>priceCart(menu,cart,vouchers));
  assert.equal((await call('/promotions/SCHEDULE10','DELETE')).status,200);assert.equal((await call('/promotions')).data.length,0);
  assert.equal((await call('/promotions','POST',voucher)).data.code,'PROMO_CODE_EXISTS');
 } finally {db.close()}
});
