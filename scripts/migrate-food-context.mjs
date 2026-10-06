import { writeFileSync } from 'node:fs';
import { menu } from '../server/menu-context.mjs';
import { createFoodRepository } from '../server/food-repository.mjs';

const repository = createFoodRepository(menu);
try {
  const fields = ['ingredients','spicyLevel','allergens','suitableFor','notSuitableFor','customizations','servingSize','pairings','drinkPairings'];
  const missing = menu.map(item => {
    const food = repository.getById(item.id);
    return {id:food.id,name:food.name,missing:fields.filter(key => food[key] == null || food[key] === '' || (Array.isArray(food[key]) && !food[key].length)),nutritionMissing:Object.values(food.nutrition).every(value=>value==null)};
  }).filter(item=>item.missing.length || item.nutritionMissing);
  writeFileSync(new URL('../server/food-context-review.json',import.meta.url),JSON.stringify({note:'Các trường chưa có dữ liệu cần nhà hàng bổ sung; mảng rỗng không chứng minh an toàn dị ứng.',total:menu.length,items:missing},null,2)+'\n');
  console.log(`Migrated/verified ${menu.length} dishes. Missing data report: server/food-context-review.json`);
} finally { repository.close(); }
