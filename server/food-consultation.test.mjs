import test from 'node:test';
import assert from 'node:assert/strict';
import { createFoodRepository } from './food-repository.mjs';
import { foodDetailChat } from './food-detail-ai.mjs';

const dish = {id:37,name:'Mực nướng sa tế',price:129000,ingredients:['mực','sa tế'],spicyLevel:'Cay vừa',allergens:['hải sản'],suitableFor:['người thích cay'],notSuitableFor:['người dị ứng hải sản'],customizations:['ít cay'],servingSize:'1–2 người',pairings:['cơm trắng'],drinkPairings:['trà chanh'],nutrition:{calories:null,protein:null,fat:null,carbs:null}};
test('only three simple fact types bypass Gemini; every consultation uses authoritative context', async () => {
 const repo=createFoodRepository([dish,{id:92,name:'Trà chanh',price:25000,categoryId:'drink'}],':memory:');
 try {
  for(const message of ['Giá bao nhiêu?','Món này gồm những gì?','Có cay không?']) {
   const answer=await foodDetailChat({foodId:37,message},[],()=>assert.fail('Unexpected Gemini call'),repo);
   assert.equal(answer.source,'database');
  }
  for(const message of ['Món này hợp với đồ uống nào?','Món này hợp với ai?','Có phù hợp cho trẻ em không?','Nên ăn kèm món gì?','Nếu ăn kiêng thì chỉnh thế nào?','Món này có hợp cho 4 người không?','Phân tích kỹ hơn','Có thể làm ít cay không?','Giá bao nhiêu và hợp cho trẻ em không?','Món gồm những gì và nên uống gì?']) {
   let calls=0;
   const reply='Bạn có thể chọn trà chanh theo gợi ý đồ uống của món.\nMón có vị cay vừa nên hãy cân nhắc khẩu vị của mình. Bạn cũng có thể chọn ít cay khi đặt món.';
   const answer=await foodDetailChat({foodId:37,message,food:{id:37,name:'Fake',price:1}},[{...dish,name:'Stale',price:2}],async request=>{
    calls++;
    for(const field of ['drinkPairings','nutrition','allergens','customizations','servingSize','suitableFor','notSuitableFor']) assert.ok(request.instruction.includes('"'+field+'":'));
    assert.ok(!request.instruction.includes('Fake'));assert.ok(!request.instruction.includes('Stale'));
    assert.match(request.instruction,message==='Phân tích kỹ hơn'?/150–250 từ/:/60–120 từ/);
    assert.equal(request.contents.at(-1).parts[0].text,message);
    return {text:JSON.stringify({reply,recommendations:[],combos:[]})};
   },repo);
   assert.equal(calls,message==='Phân tích kỹ hơn'?2:1);assert.equal(answer.source,'gemini');assert.equal(answer.reply,reply);
  }
 } finally {repo.close();}
});
