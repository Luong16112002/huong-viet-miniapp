import test from 'node:test';
import assert from 'node:assert/strict';
import {createAIContextService,ownerFromAuthorization,detectIntent} from './services/aiContextService.mjs';
import {contextChat} from './ai-context-chat.mjs';
const menu=[{id:1,name:'Phở bò',price:65000,description:'Nước dùng xương',categoryId:'main-dish',servingSize:'1 người',available:true,ingredients:['thịt bò']},{id:2,name:'Trà chanh',price:25000,categoryId:'drink',available:true},{id:3,name:'Món ẩn',price:10000,available:false}];
const auth='Bearer '+'a'.repeat(64),owner=ownerFromAuthorization(auth);let reads=[];
const service=createAIContextService({menu,foods:{list:()=>menu},restaurant:()=>({name:'Hương Việt',openHours:'10:00 - 22:00',address:'Địa chỉ thật'}),commerce:{aiRecords:(id,kind)=>{reads.push({id,kind});return id===owner?[{id:'o1',orderCode:'HV-123',state:'preparing',totalAmount:65000,items:[{name:'Phở bò',quantity:1,price:65000}]}]:[]},availableTables:()=>[]},vouchers:[{code:'OK',enabled:true,amount:10000,minSubtotal:50000,expiresAt:'2099-01-01'},{code:'EXPIRED',enabled:true,amount:10000,expiresAt:'2000-01-01'}]});
test('intent routing and minimization isolate food from private records',()=>{reads=[];const b=service.build({message:'Phở bò có cay không?'},auth);assert.equal(b.intent,'FOOD_INFO');assert.equal(b.context.food.id,1);assert.deepEqual(reads,[]);assert.equal(b.context.orders,undefined);const drinks=service.build({message:'Phở bò hợp với đồ uống nào?'},auth);assert.equal(drinks.context.drinks[0].name,'Trà chanh');assert.equal(drinks.context.menu,undefined)});
test('orders are scoped by bearer owner, never by supplied userId',()=>{const b=service.build({message:'Đơn của tôi đang ở đâu?',userId:'victim'},auth);assert.equal(b.context.orders[0].orderCode,'HV-123');const other=service.build({message:'Đơn của tôi đang ở đâu?',userId:owner},'Bearer '+'b'.repeat(64));assert.deepEqual(other.context.orders,[]);const missing=service.build({message:'Đơn của tôi đang ở đâu?',userId:owner},'');assert.equal(missing.context.orders,null)});
test('cart prices are recalculated and expired offers excluded',()=>{const b=service.build({message:'Có voucher nào dùng được không?',cart:{items:[{productId:1,quantity:2,price:1}]}},auth);assert.equal(b.context.cart.subtotal,130000);assert.equal(b.context.promotions.length,1);assert.equal(b.context.promotions[0].eligible,true);assert.equal(service.build({message:'Giỏ hàng đủ chưa?',cart:{items:[{productId:3,quantity:1}]}},auth).context.cart.known,false)});
test('memory retains people and food only within owner/session, limits history',()=>{service.build({sessionId:'session-test',message:'Tư vấn cho 4 người'},auth);const b=service.build({sessionId:'session-test',message:'Ngân sách 800k thôi'},auth);assert.equal(b.prepared.context.people,4);assert.equal(b.prepared.context.budget,800000);assert.ok(b.prepared.context.calculatedCombos.every(c=>c.total<=800000));assert.equal(service.build({sessionId:'session-test',message:'Ngân sách 800k thôi'},'Bearer '+'b'.repeat(64)).prepared.context.people,null);const h=service.build({message:'Xin chào',history:Array.from({length:100},()=>({role:'user',text:'xin chào'}))},auth);assert.equal(h.history.length,10)});
test('availability never invents tables and asks for missing filters',()=>{assert.equal(service.build({message:'Còn bàn không?'},auth).context.availability.needs.length,3);assert.equal(detectIntent('Tôi đã đặt bàn chưa?'),'BOOKING_STATUS');assert.equal(detectIntent('Nhà hàng mở cửa lúc mấy giờ?'),'RESTAURANT_INFO')});
test('Gemini interprets price with only relevant server facts',async()=>{
  let calls=0;
  const r=await contextChat({message:'Phở bò bao nhiêu?'},auth,service,async({instruction})=>{calls++;assert.ok(instruction.includes('65000'));assert.ok(!instruction.includes('HV-123'));return {text:JSON.stringify({reply:'Phở bò giá 65.000đ/phần nhé.',suggestedActions:[{type:'OPEN_ORDER',id:'victim'}]})}});
  assert.equal(calls,1);assert.match(r.reply,/65.000/);assert.ok(r.suggestedActions.every(a=>a.type==='OPEN_FOOD'));
});

const fixedNow = () => Date.parse('2026-10-03T09:00:00+07:00');
function tablesService(query) {
  return createAIContextService({menu, foods:{list:()=>menu}, restaurant:()=>({}), vouchers:[], now:fixedNow, commerce:{availableTables:query,aiRecords:()=>[]}});
}
test('table context ranks only five, recalls selections and Gemini explains availability',async()=>{
  const queries=[];
  const s=tablesService(f=>{queries.push(f);return f.area==='garden'?Array.from({length:80},(_,i)=>({id:'SV-'+i,area:'garden',capacity:i<5?4:8})):[]});
  const first=s.build({message:'Có bàn cho 4 người hôm nay lúc 19:00 không?',sessionId:'tables-session'},auth);
  assert.equal(first.context.availability.count,80);assert.equal(first.context.availability.tables.length,5);
  assert.ok(first.context.availability.tables.every(t=>t.capacity===4));
  let calls=0;
  const r=await contextChat({message:'có bàn',sessionId:'tables-session'},auth,s,async({instruction})=>{calls++;assert.ok(instruction.includes('còn khá nhiều bàn'));assert.ok(!instruction.includes('SV-79'));return {text:JSON.stringify({reply:'Có nhé. Với 4 người lúc 19:00 hôm nay vẫn còn khá nhiều bàn phù hợp. Bạn thích Sân vườn không?',availabilityStatus:'available'})}});
  assert.equal(calls,1);assert.equal(r.context.bookingFilters.date,'2026-10-03');assert.equal(r.context.bookingFilters.guests,4);
  assert.ok(r.suggestedActions.some(a=>a.type==='SELECT_AREA'&&a.value==='garden'));
  const follow=s.build({message:'sân vườn',sessionId:'tables-session'},auth);
  assert.equal(follow.context.availability.filters.time,'19:00');assert.equal(follow.context.availability.filters.area,'garden');
});
test('no implicit dates, missing fields skip query; zero inventory cannot be changed by Gemini',async()=>{
  let calls=0;
  const s=tablesService(f=>{calls++;return f.time==='19:00'?[{id:f.area,area:f.area,capacity:4}]:[]});
  const missing=s.build({message:'Có bàn 4 người lúc 18:30 không?'},auth);
  assert.deepEqual(missing.context.availability.needs,['date']);assert.equal(calls,0);assert.equal(missing.memory.bookingFilters.date,undefined);
  const input={message:'Có bàn 4 người hôm nay lúc 18:30 không?'};
  await assert.rejects(contextChat(input,auth,s,async()=>({text:JSON.stringify({reply:'Có bàn nhé',availabilityStatus:'available'})})),/contradicts/);
  await contextChat(input,auth,s,async({instruction})=>{assert.ok(instruction.includes('"count":0'));assert.ok(instruction.includes('19:00'));return {text:JSON.stringify({reply:'Khung này hết bàn rồi, bạn chuyển sang 19:00 nhé?',availabilityStatus:'unavailable'})}});
});
test('specific food intents and aliases resolve real menu without private data',()=>{
  assert.equal(detectIntent('Phở bò gồm những gì?'),'FOOD_INGREDIENTS');
  assert.equal(detectIntent('Món này có gây dị ứng không?'),'FOOD_ALLERGY');
  assert.equal(detectIntent('Có mã nào dùng được không?'),'PROMOTION');
  assert.equal(service.getFoodByName('pho bo').id,1);
  assert.equal(service.getFoodById(3),null);
  assert.deepEqual(service.getPromotions(owner,{known:true,itemCount:1,subtotal:1000}),[]);
});

test('order facts are current and Gemini provides the explanation',async()=>{
  const result=await contextChat({message:'Đơn của tôi đang ở đâu?',history:[{role:'model',text:'Đơn đã giao.'}]},auth,service,async({instruction})=>{assert.ok(instruction.includes('preparing'));return {text:JSON.stringify({reply:'Đơn HV-123 đang được chuẩn bị nhé. Nhà hàng đang chế biến món cho bạn.'})}});
  assert.match(result.reply,/đang được chuẩn bị/);
});
test('rice question retrieves the real category, capped at five, with real actions',async()=>{
  const rice={id:4,name:'Cơm chiên hải sản',category:'Cơm',price:69000,unit:'phần',description:'Cơm chiên cùng hải sản',available:true};
  const items=[...menu,rice];
  const s=createAIContextService({menu:items,foods:{list:()=>items},restaurant:()=>({}),vouchers:[],commerce:{}});
  assert.equal(detectIntent('có cơm nhỉ'),'FOOD_CATEGORY');
  const r=await contextChat({message:'có cơm nhỉ'},auth,s,async({instruction})=>{assert.ok(instruction.includes('69000'));assert.ok(instruction.includes('"count":1'));assert.ok(!instruction.split('CONTEXT THỰC TẾ TỪ HỆ THỐNG')[1].includes('Phở bò'));return {text:JSON.stringify({reply:'Có nhé. Cơm chiên hải sản giá 69.000đ/phần, mình có thể gợi ý món kèm nếu bạn muốn.'})}});
  assert.ok(r.suggestedActions.some(a=>a.type==='ADD_TO_CART'&&a.id===4));
});
