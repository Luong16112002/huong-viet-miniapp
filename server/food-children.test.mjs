import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { foodContext, createFoodRepository } from './food-repository.mjs';
import { foodDetailChat, MISSING_FOOD_INFO } from './food-detail-ai.mjs';
const dish={id:1,name:'Bò nướng lá lốt',price:89000,description:'Mô tả cũ',ingredients:['Thịt bò','Rượu đắng'],ingredientsSource:'menu_description'};

test('child fields preserve false and unknown, never infer safety from empty allergens',()=>{
 assert.equal(foodContext({}).suitableForChildren,null);
 assert.equal(foodContext({suitableForChildren:false}).suitableForChildren,false);
 assert.equal(foodContext({childNotes:'Không phù hợp'}).childNotes,'Không phù hợp');
});
test('child consultation and all requested advice go through Gemini with full SQLite data',async()=>{
 const repo=createFoodRepository([dish,{id:92,name:'Trà chanh',price:25000,categoryId:'drink'}],':memory:');
 try {
  for(const message of ['Món này hợp với ai?','Có phù hợp trẻ em không?','Có thể làm ít cay không?','Nên ăn kèm gì?','Hợp với đồ uống nào?']) {
   let calls=0;
   const result=await foodDetailChat({foodId:1,message,food:{suitableForChildren:false}},[],async request=>{
    calls++;
    assert.match(request.instruction,/"suitableForChildren":true/);
    assert.match(request.instruction,/"childNotes":"Có thể phù hợp/);
    assert.match(request.instruction,/"spicyLevel":"Không cay"/);
    assert.match(request.instruction,/"customizations":\["ít gia vị","không cay","cắt nhỏ"\]/);
    assert.match(request.instruction,/3–5 câu/);
    assert.match(request.instruction,/Thông tin dị ứng chi tiết/);
    assert.ok(!request.instruction.includes(MISSING_FOOD_INFO));
    return {text:JSON.stringify({reply:'Món không cay nên có thể phù hợp với trẻ em. Bạn có thể yêu cầu ít gia vị và cắt nhỏ theo ghi chú của món. Thông tin dị ứng chi tiết của món này chưa được cập nhật.',recommendations:[],combos:[]})};
   },repo);
   assert.equal(calls,1);assert.equal(result.source,'gemini');
  }
 } finally {repo.close();}
});
test('child migration updates old demo facts once while preserving price and subsequent restaurant edits',()=>{
 const dir=mkdtempSync(join(tmpdir(),'child-food-'));const path=join(dir,'foods.sqlite');
 try {
  const db=new DatabaseSync(path);
  db.exec('CREATE TABLE foods(id TEXT PRIMARY KEY,data TEXT NOT NULL);CREATE TABLE food_migrations(version TEXT PRIMARY KEY)');
  db.prepare('INSERT INTO food_migrations VALUES (?)').run('context-v2.1');
  db.prepare('INSERT INTO foods VALUES (?,?)').run('1',JSON.stringify({...dish,price:99000}));db.close();
  let repo=createFoodRepository([dish],path);const food=repo.getById(1);repo.close();
  assert.equal(food.price,99000);assert.equal(food.suitableForChildren,true);assert.deepEqual(food.ingredients,['thịt bò','lá lốt','sả','tỏi','gia vị']);
  const edited=new DatabaseSync(path);edited.prepare('UPDATE foods SET data=? WHERE id=?').run(JSON.stringify({...food,suitableForChildren:false,childNotes:'Nhà hàng cập nhật'}),'1');edited.close();
  repo=createFoodRepository([dish],path);assert.equal(repo.getById(1).suitableForChildren,false);assert.equal(repo.getById(1).childNotes,'Nhà hàng cập nhật');repo.close();
 } finally {rmSync(dir,{recursive:true,force:true});}
});
