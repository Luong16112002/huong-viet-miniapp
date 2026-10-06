import test from 'node:test';
import assert from 'node:assert/strict';
import { createFoodRepository } from './food-repository.mjs';
import { foodDetailChat, MISSING_FOOD_INFO } from './food-detail-ai.mjs';
const dish = { id: 'food_001', name: 'Phở gà', price: 59000, unit: 'phần', category: 'Món chính', description: 'Phở gà xé.', ingredients: ['bánh phở', 'thịt gà', 'nước dùng gà', 'hành lá', 'rau thơm'], spicyLevel: 'Không cay', allergens: ['Có thể chứa gluten'], suitableFor: ['trẻ em nếu không dị ứng thành phần'], notSuitableFor: [], customizations: ['ít hành', 'không hành', 'thêm rau'], servingSize: '1 người', calories: null, available: true, pairings: ['quẩy', 'rau thêm', 'nước chanh'] };
const never = () => { throw new Error('Gemini must not be called'); };

test('SQLite lookup overrides client and stale menu for every simple intent', async () => {
 const repo = createFoodRepository([dish], ':memory:');
 try {
  for (const [message, expected] of [['Giá bao nhiêu?', '59.000'], ['Món gồm những gì?', 'bánh phở'], ['Món này có gì?', 'thịt gà'], ['Có cay không?', 'Không cay']]) {
   const result = await foodDetailChat({foodId:dish.id,message,food:{id:'fake',price:1}},[{...dish,price:1}],never,repo);
   assert.equal(result.source,'database'); assert.ok(result.reply.includes(expected));
  }
  await assert.rejects(() => foodDetailChat({foodId:'missing',message:'Giá?'},[dish],never,repo),e=>e.status===404);
  await assert.rejects(() => foodDetailChat({message:'Giá?'},[dish],never,repo),e=>e.status===400);
 } finally { repo.close(); }
});

test('consultation sends complete database context and question to Gemini', async () => {
 const repo = createFoodRepository([dish], ':memory:');
 try {
  for (const message of ['Có phù hợp trẻ em không?', 'Tôi nên ăn kèm gì cho 4 người?', 'Nếu tôi dị ứng thì sao?', 'Có thể thay đổi món thế nào?', 'Tôi ăn kiêng, có thể làm ít cay không?']) {
   const result = await foodDetailChat({foodId:dish.id,message},[],async request => {
    for (const [key,value] of Object.entries(dish)) assert.ok(request.instruction.includes(JSON.stringify(key)+':'+JSON.stringify(value)),key);
    assert.equal(request.contents.at(-1).parts[0].text,message);
    assert.ok(request.instruction.includes("chỉ nói ngắn tên trường đó"));
    return {text:JSON.stringify({reply:'Tư vấn theo dữ liệu.',recommendations:[],combos:[]})};
   },repo);
   assert.equal(result.source,'gemini');
  }
 } finally {repo.close();}
});

test('every record has the full context shape without invented unknown facts', () => {
 const repo = createFoodRepository([{id:2,name:'Món khác',price:10000}],':memory:');
 try {
  const food = repo.getById(2);
  for (const key of Object.keys(dish)) assert.ok(Object.hasOwn(food,key),key);
  assert.equal(food.spicyLevel,null); assert.equal(food.available,null); assert.deepEqual(food.allergens,[]);
 } finally {repo.close();}
});
