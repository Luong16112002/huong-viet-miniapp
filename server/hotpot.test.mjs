import test from 'node:test';
import assert from 'node:assert/strict';
import { menu } from './menu-context.mjs';
import { priceCart } from './cart-pricing.mjs';
import { foodDetailChat } from './food-detail-ai.mjs';

const soups = menu.filter(p => p.variantGroups?.some(g => g.id === 'size'));
const product = soups[0];
const options = product.variantGroups.filter(g => g.isRequired).map(g => ({name:g.title,value:g.options[0].name,price:-999999}));
const draft = extra => ({deliveryType:'pickup',items:[{productId:product.id,quantity:2,options:[...options,...extra]}]});
test('eight unique hotpots have requested prices and canonical ingredients', () => {
  assert.equal(soups.length,8);
  assert.equal(new Set(menu.map(p=>p.id)).size,menu.length);
  assert.deepEqual(soups.map(p=>p.price),[199000,329000,299000,269000,289000,319000,279000,399000]);
  assert.ok(soups.every(p=>p.ingredients.length && p.spicyLevel));
});
test('hotpot quotes price toppings from server and reject missing or duplicated options', () => {
  const topping=product.variantGroups.find(g=>g.id==='toppings');
  const added={name:topping.title,value:topping.options[0].name,price:0};
  assert.equal(priceCart(menu,draft([added])).total,516000);
  assert.throws(()=>priceCart(menu,draft([added,added])));
  assert.throws(()=>priceCart(menu,{deliveryType:'pickup',items:[{productId:product.id,quantity:1}]}));
  assert.throws(()=>priceCart(menu,draft([{name:'fake',value:'free',price:0}])));
  const duplicate=draft([]);duplicate.items[0].options.push({...options[0],value:product.variantGroups[0].options[1].name});
  assert.throws(()=>priceCart(menu,duplicate));
});
test('hotpot consultations call Gemini with canonical menu and no client supplied facts', async () => {
  for(const message of ['Lẩu này phù hợp mấy người?','Có hải sản không?','Nên gọi thêm topping gì?','Combo nào phù hợp ngân sách?']) {
    let called=false;
    const result=await foodDetailChat({food:{id:product.id,price:1},message},menu,async request=>{
      called=true;assert.ok(request.instruction.includes(JSON.stringify(product.price)));assert.ok(request.instruction.includes(product.name));
      return {text:JSON.stringify({reply:'Tư vấn dựa trên dữ liệu món.',recommendations:[],combos:[]})};
    });
    assert.ok(called);assert.equal(result.source,'gemini');
  }
});
