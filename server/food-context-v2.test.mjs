import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { createFoodRepository } from './food-repository.mjs';
import { foodDetailChat } from './food-detail-ai.mjs';
import { menu } from './menu-context.mjs';
const never = () => { assert.fail('Simple facts must not call Gemini'); };

test('all current dishes get consistent context; known squid facts answer without Gemini', async () => {
  const repo = createFoodRepository(menu, ':memory:');
  try {
    for (const item of menu) {
      const food = repo.getById(item.id);
      for (const key of ['ingredients','allergens','suitableFor','notSuitableFor','customizations','pairings','drinkPairings']) assert.ok(Array.isArray(food[key]), `${food.name}: ${key}`);
      assert.ok(food.ingredients.length, food.name);
      for (const key of ['calories','protein','fat','carbs']) assert.ok(Object.hasOwn(food.nutrition,key));
    }
    const squid = menu.find(p => p.name === 'Mực nướng sa tế');
    for (const [message, expected] of [
      ['Món này có cay không?', /Cay vừa.*ít cay/],
      ['Món này gồm những gì?', /mực tươi.*sa tế/],
    ]) {
      const result = await foodDetailChat({foodId:squid.id,message},menu,never,repo);
      assert.equal(result.source,'database'); assert.match(result.reply,expected);
    }
    const result = await foodDetailChat({foodId:squid.id,message:'Tôi dị ứng hải sản có ăn được không?'}, menu, async request => {
      assert.match(request.instruction, /drinkPairings/);
      assert.match(request.instruction, /người dị ứng hải sản/);
      return {text:JSON.stringify({reply:'Món có hải sản; không phù hợp với người dị ứng hải sản.',recommendations:[],combos:[]})};
    },repo);
    assert.equal(result.source,'gemini');
  } finally { repo.close(); }
});

test('migration fills old rows once, preserves edited price, known facts and later intentional empty values', () => {
  const dir=mkdtempSync(join(tmpdir(),'food-context-'));
  const file=join(dir,'foods.sqlite');
  try {
    const db=new DatabaseSync(file);
    db.exec('CREATE TABLE foods (id TEXT PRIMARY KEY, data TEXT NOT NULL)');
    db.prepare('INSERT INTO foods VALUES (?,?)').run('21',JSON.stringify({id:21,name:'Phở gà',price:12345,ingredients:[],spicyLevel:'Cay riêng',allergens:['do nhà hàng sửa'],available:false}));db.close();
    let repo=createFoodRepository(menu,file);
    let food=repo.getById(21);
    assert.equal(food.price,12345);assert.equal(food.available,false);assert.equal(food.spicyLevel,'Cay riêng');assert.deepEqual(food.allergens,['do nhà hàng sửa']);assert.ok(food.ingredients.length);assert.ok(food.drinkPairings.length);
    repo.close();
    const edit=new DatabaseSync(file);food.drinkPairings=[];edit.prepare('UPDATE foods SET data=? WHERE id=?').run(JSON.stringify(food),'21');edit.close();
    repo=createFoodRepository(menu,file);assert.deepEqual(repo.getById(21).drinkPairings,[]);repo.close();
  } finally { rmSync(dir,{recursive:true,force:true}); }
});
