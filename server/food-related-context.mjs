import { normalize } from './chef-engine.mjs';

const category = value => normalize(value).trim().replace(/\s+/g, '-');
const matches = (food, names) => [food.categoryId, food.category].some(value => names.includes(category(value)));
export async function relatedFoodContext(message, food, menu, repository) {
  const q = normalize(message);
  const drinksIntent = /do uong|nuoc uong|uong (gi|nao)|goi.*nuoc/.test(q);
  const sidesIntent = /an kem|di kem|mon kem|khai vi/.test(q);
  // Query the live database, including new items absent from the original seed menu.
  const records = repository?.list ? await repository.list() : repository
    ? await Promise.all(menu.map(p => repository.getById(p.id))) : menu;
  const available = records.filter(p => p && String(p.id) !== String(food.id) && p.available !== false && p.availability !== false);
  const drinks = drinksIntent ? available.filter(p => matches(p, ['drink','nuoc-uong','do-uong'])) : [];
  const sides = sidesIntent ? available.filter(p => matches(p, ['starter','khai-vi','mon-kem','side-dish']) || (!matches(p, ['drink','nuoc-uong','do-uong']) && food.pairings.some(name => normalize(name) === normalize(p.name)))) : [];
  const named = !drinksIntent && !sidesIntent ? available.filter(p => [...food.pairings, ...food.drinkPairings].some(name => normalize(name) === normalize(p.name))) : [];
  const related = [...new Map([...drinks,...sides,...named].map(p => [String(p.id),p])).values()];
  const compact = p => ({id:p.id,name:p.name,price:p.price,description:p.description || '',tags:p.tags || [],ingredients:p.ingredients || [],allergens:p.allergens || []});
  return {drinksIntent,sidesIntent,related,drinkContext:drinks.map(compact),sideContext:sides.map(compact)};
}
