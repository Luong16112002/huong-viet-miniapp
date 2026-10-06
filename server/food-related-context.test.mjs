import test from 'node:test';
import assert from 'node:assert/strict';
import { createFoodRepository } from './food-repository.mjs';
import { foodDetailChat } from './food-detail-ai.mjs';
const food={id:4,name:'Phở bò',price:65000,description:'Nước dùng đậm đà',pairings:[],drinkPairings:[]};
const drinks=[{id:92,name:'Trà chanh',price:25000,categoryId:'drink',description:'Chua ngọt nhẹ'},{id:93,name:'Nước lọc',price:15000,category:'nuoc-uong'},{id:94,name:'Trà nóng',price:20000,category:'Đồ uống',tags:['nóng']}];
test('drink intent loads live SQLite menu even without pairings and validates prices',async()=>{
 const repo=createFoodRepository([food,...drinks,{id:95,name:'Đã hết',price:1,categoryId:'drink',available:false}],':memory:');
 try {
  const result=await foodDetailChat({foodId:4,message:'Món này hợp với đồ uống nào?'},[food],async request=>{
   assert.match(request.instruction,/ĐỒ UỐNG ĐANG CÓ/);
   for(const item of drinks) assert.ok(request.instruction.includes(item.name));
   assert.ok(!request.instruction.includes('Đã hết'));
   return {text:JSON.stringify({reply:'Bạn có thể chọn Trà chanh hoặc Nước lọc. Trà chanh có vị chua ngọt nhẹ. Nước lọc là một lựa chọn khác trong thực đơn.',recommendations:[{id:92,quantity:1,price:1},{id:93,quantity:1}],combos:[]})};
  },repo);
  assert.equal(result.source,'gemini');assert.equal(result.recommendations[0].price,25000);
  await assert.rejects(()=>foodDetailChat({foodId:4,message:'Hợp với đồ uống nào?'},[],async()=>({text:JSON.stringify({reply:'Bịa',recommendations:[{id:95,quantity:1}],combos:[]})}),repo));
 } finally {repo.close();}
});
test('empty drinks has exact response and no invented menu or model call',async()=>{
 const result=await foodDetailChat({foodId:4,message:'Món này hợp với đồ uống nào?'},[food],()=>assert.fail('No drinks'));
 assert.equal(result.reply,'Hiện tại thực đơn chưa có dữ liệu đồ uống để mình gợi ý chính xác.');
});
test('side intent retrieves starter categories, rejects drinks and keeps personal advice scoped',async()=>{
 const menu=[food,...drinks,{id:2,name:'Gỏi cuốn',price:49000,categoryId:'starter'},{id:3,name:'Rau thêm',price:19000,category:'mon-kem'}];
 await foodDetailChat({foodId:4,message:'Gợi ý món ăn kèm'},menu,async request=>{
  assert.match(request.instruction,/Gỏi cuốn/);assert.match(request.instruction,/Rau thêm/);assert.ok(!request.instruction.includes('Trà chanh'));
  return {text:JSON.stringify({reply:'Có thể chọn Gỏi cuốn.',recommendations:[{id:2,quantity:1}],combos:[]})};
 });
 await foodDetailChat({foodId:4,message:'Món này hợp với ai?'},menu,async request=>{
  assert.ok(!request.instruction.includes('Trà chanh'));assert.ok(!request.instruction.includes('Gỏi cuốn'));
  return {text:JSON.stringify({reply:'Tư vấn món hiện tại.',recommendations:[],combos:[]})};
 });
});
