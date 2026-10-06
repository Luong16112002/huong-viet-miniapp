import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareChat,structuredAnswer,chefInstruction} from './chef-engine.mjs';
const menu=Array.from({length:50},(_,i)=>({id:i+1,name:i===0?'Phở bò':i===1?'Tôm nướng':'Món '+i,description:i===0?'Thịt bò tái và rau thơm':i===1?'Tôm tươi':'Rau củ',price:50000+i*1000,features:i%2===0?['vegetarian']:[]}));
test('retrieves limited relevant menu, never entire catalog',()=>{
 const p=prepareChat({message:'Phở bò có thành phần gì?'},menu);
 assert.equal(p.candidates[0].id,1);assert.equal(p.candidates.length,18);
 assert.ok(!chefInstruction('Base',p).includes('Món 49'));
});
test('followup budget retains guests without interpreting model examples',()=>{
 const p=prepareChat({message:'1 triệu',history:[{role:'user',text:'Gợi ý món cho 4 người'},{role:'model',text:'Ngân sách bao nhiêu? Ví dụ 8 người 2 triệu'}]},menu);
 assert.equal(p.context.people,4);assert.equal(p.context.budget,1000000);assert.equal(p.intent,'COMBO');
});
test('filters restrictions, exclusions and honors favorite ranking',()=>{
 const p=prepareChat({message:'Gợi ý món',context:{preferences:['Không ăn hải sản'],excludedIds:[1],favorites:[40]}},menu);
 assert.ok(!p.candidates.some(x=>x.id===2||x.id===1));assert.equal(p.candidates[0].id,40);
});
test('recalculates combo totals; ignores AI prices and duplicate/over-budget combos',()=>{
 const p=prepareChat({message:'4 người 200 nghìn'},menu);
 const combo={name:'Combo',items:[{id:1,quantity:2,price:1}]};
 const out=structuredAnswer({text:JSON.stringify({reply:'Gợi ý',recommendations:[],combos:[combo,combo,{name:'Quá tiền',items:[{id:1,quantity:20}]}]})},p);
 assert.equal(out.combos.length,1);assert.equal(out.combos[0].total,100000);assert.equal(out.combos[0].remaining,100000);
});
test('unknown IDs cannot become actionable cards',()=>{
 const p=prepareChat({message:'gợi ý'},menu);
 assert.throws(()=>structuredAnswer({text:JSON.stringify({reply:'Gợi ý',recommendations:[{id:999,quantity:1}],combos:[]})},p));
});
test('booking intent and guest count recognized',()=>{
 const p=prepareChat({message:'Đặt bàn 4 người tối nay'},menu);assert.equal(p.intent,'BOOK_TABLE');assert.equal(p.context.people,4);
});
