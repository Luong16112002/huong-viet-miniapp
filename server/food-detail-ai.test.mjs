import test from 'node:test';
import assert from 'node:assert/strict';
import {foodDetailChat,MISSING_FOOD_INFO} from './food-detail-ai.mjs';
const menu=[{id:22,name:'Bò xào nấm',price:85000,description:'Thịt bò, nấm và hành tây.',features:[],ingredients:null,allergens:null,availableOptions:['Ít hành'],pairings:['Phở gà']},{id:21,name:'Phở gà',price:59000,description:'Gà và rau thơm',features:[]}];
const never=()=>{throw new Error('Must not call Gemini')};
test('price is server authoritative; no Gemini call',async()=>{
 const r=await foodDetailChat({message:'Giá bao nhiêu?',food:{id:22,price:1,name:'Fake'}},menu,never);assert.ok(r.reply.includes('85.000'));assert.equal(r.source,'database');
});
test('ingredients use description without inventing full list',async()=>{
 const r=await foodDetailChat({message:'Món này gồm những gì?',food:{id:22}},menu,never);assert.ok(r.reply.includes(menu[0].description));assert.ok(r.reply.includes('Chưa có danh sách'));
});
test('missing spice uses exact missing information response', async () => {
 const r = await foodDetailChat({foodId:22,message:'Có cay không?'},menu,never);
 assert.equal(r.reply,MISSING_FOOD_INFO);
});
test('unknown food rejects even with fabricated client context',async()=>{
 await assert.rejects(()=>foodDetailChat({message:'Giá?',food:{id:999,price:1}},menu,never),e=>e.status===404);
});
test('complex request carries canonical current food and history, validates pairing',async()=>{
 let seen;
 const r=await foodDetailChat({message:'Tôi nên chọn món ăn kèm gì cho 4 người?',food:{id:22,ingredients:['Fake']},history:[{role:'user',text:'Tôi thích thanh đạm'}]},menu,async request=>{seen=request;return {text:JSON.stringify({reply:'Bạn có thể chọn Phở gà.',recommendations:[{id:21,quantity:1}],combos:[]})}});
 assert.ok(seen.instruction.includes('Bò xào nấm'));assert.ok(!seen.instruction.includes('Fake'));assert.equal(seen.contents[0].parts[0].text,'Tôi thích thanh đạm');assert.equal(r.recommendations[0].price,59000);
});
test('invalid Gemini recommendation cannot become card',async()=>{
 await assert.rejects(()=>foodDetailChat({message:'Món ăn kèm?',food:{id:22}},menu,async()=>({text:JSON.stringify({reply:'Gợi ý',recommendations:[{id:999,quantity:1}]})})));
});

test('drink pairing searches drinks even when dish-name matches dominate menu',async()=>{
 const foods=Array.from({length:25},(_,i)=>({id:100+i,pairings:['Trà chanh','Nước dừa'],name:'Sườn nướng '+i,description:'Sườn heo mật ong',price:99000,categoryId:'main-dish',features:[]}));
 const drinks=[{id:200,name:'Trà chanh',description:'Trà chanh thanh mát',price:25000,categoryId:'drink',features:[]},{id:201,name:'Nước dừa',description:'Nước dừa tươi',price:35000,categoryId:'drink',features:[]}];
 let instruction;
 const result=await foodDetailChat({message:'Món này hợp với đồ uống nào?',food:{id:100}},[...foods,...drinks],async req=>{instruction=req.instruction;return {text:JSON.stringify({reply:'Bạn có thể thử Trà chanh.',recommendations:[{id:200,quantity:1}],combos:[]})};});
 assert.ok(instruction.includes('Trà chanh'));assert.ok(instruction.includes('Nước dừa'));assert.equal(result.source,'gemini');assert.equal(result.recommendations[0].id,200);
});
