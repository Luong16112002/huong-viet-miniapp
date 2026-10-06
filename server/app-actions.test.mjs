import test from 'node:test';
import assert from 'node:assert/strict';
import {createAIContextService,detectIntent} from './services/aiContextService.mjs';
import {contextChat} from './ai-context-chat.mjs';
const auth='Bearer '+'d'.repeat(64);
function makeService() {
  return createAIContextService({menu:[],foods:{list:()=>[]},restaurant:()=>({}),vouchers:[],now:()=>Date.parse('2026-10-06T09:00:00+07:00'),commerce:{availableTables:f=>[{id:'SV-021',code:'SV-021',area:f.area,capacity:4}]}});
}
test('navigation questions produce actual actions without querying private records',()=>{
  const service=makeService();
  for(const [message,type] of [['đặt bàn ở đâu','OPEN_BOOKING'],['đặt món ở đâu','OPEN_MENU'],['xem giỏ hàng','OPEN_CART'],['xem giỏ ở đâu','OPEN_CART'],['xem đơn','OPEN_ORDERS'],['dùng mã giảm giá','OPEN_PROMOTIONS']]) {
    assert.equal(detectIntent(message),'APP_ACTION');
    const b=service.build({message},auth);
    assert.equal(b.actions[0].type,type);assert.ok(b.context.appRoutes[type]);
  }
  assert.equal(detectIntent('Đơn của tôi đang ở đâu?'),'ORDER_STATUS');
});
test('generic booking button request remembers table conversation across repeated action turns',async()=>{
  const service=makeService(),sessionId='action-session';
  service.build({message:'Có bàn 4 người ngày 2026-10-07 lúc 19:00 không?',sessionId},auth);
  const result=await contextChat({message:'có nút đặt ko',sessionId},auth,service,async({instruction})=>{
    assert.ok(instruction.includes('Đặt bàn ngay'));assert.ok(instruction.includes('/reservation'));
    return {text:JSON.stringify({reply:'Có nhé. Bấm “Đặt bàn ngay” bên dưới để chọn bàn.',suggestedActions:[{type:'OPEN_FOOD',id:999,label:'Fake'}]})};
  });
  assert.deepEqual(result.suggestedActions,[{type:'OPEN_BOOKING',label:'Đặt bàn ngay'}]);
  assert.equal(service.build({message:'có nút đặt ko',sessionId},auth).actions[0].type,'OPEN_BOOKING');
});
test('select table actions contain only live suggestions and preserve booking selection',()=>{
  const b=makeService().build({message:'Có bàn sân vườn 4 người ngày 2026-10-07 lúc 19:00 không?'},auth);
  const a=b.actions.find(a=>a.type==='SELECT_TABLE');
  assert.equal(a.id,'SV-021');assert.deepEqual(a.bookingFilters,{date:'2026-10-07',time:'19:00',guests:4,area:'garden'});
});
