import { HOTPOT_IMAGES } from './food-images.mjs';
import vouchers from './vouchers.json' with {type:'json'};
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';
const result = await build({ entryPoints: [fileURLToPath(new URL('../src/services/home/home-content.ts', import.meta.url))], bundle: true, write: false, platform: 'node', format: 'esm', alias: { '@': fileURLToPath(new URL('../src', import.meta.url)) }, loader: { '.jpg': 'empty', '.png': 'empty', '.webp': 'empty', '.svg': 'empty' } });
const { getHomeContent } = await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`);
const content = getHomeContent();
export const getRestaurantContextSource = () => content.restaurant;
const featured = content.featured.map(p => {
  const image = typeof p.imageUrl === 'string' && p.imageUrl.trim() ? p.imageUrl : `/api/foods/${p.id}/image`;
  return { ...p, imageUrl: image, image, shortDescription: p.description, category: p.categoryId, isPopular: p.features.includes('bestseller'), isNew: !!p.newMarked || p.features.includes('new'), isFavorite: false };
});
export async function homeRoute(req, res, send) {
  if (req.method !== 'GET') return false;
  const path = new URL(req.url, 'http://localhost').pathname;
  if (Object.values(HOTPOT_IMAGES).includes(path)) {
    try {
      const image = await readFile(new URL(`../src/public${path}`, import.meta.url));
      res.writeHead(200, {'Content-Type':'image/jpeg','Cache-Control':'public, max-age=3600','Access-Control-Allow-Origin':'*'});
      res.end(image);
    } catch { send(res,404,{error:'Không tìm thấy ảnh món'}); }
    return true;
  }
  if(path==='/api/vouchers') {const now=Date.now();send(res,200,vouchers.filter(v=>v.enabled===true&&(!v.startsAt||Date.parse(v.startsAt)<=now)&&(!v.expiresAt||Date.parse(v.expiresAt)>now)).map((v,i)=>({code:v.code,title:v.title||('Giảm '+v.amount.toLocaleString('vi-VN')+'đ'),description:v.description||('Cho đơn từ '+(v.minSubtotal||0).toLocaleString('vi-VN')+'đ'),expiry:v.expiresAt||null,theme:['green','orange','gold'][i%3],minSubtotal:v.minSubtotal||0,amount:v.amount})));return true;}
  const payloads = { '/api/home': { ...content, featured }, '/api/foods/featured': featured, '/api/categories': content.categories, '/api/promotions': content.promotions };
  if (Object.hasOwn(payloads, path)) { send(res, 200, payloads[path]); return true; }
  const match = path.match(/^\/api\/foods\/(\d+)\/image$/);
  if (!match) return false;
  const food = featured.find(p => p.id === Number(match[1]));
  if (!food) { send(res, 404, { error: 'Không tìm thấy món' }); return true; }
  try {
    const image = await readFile(new URL(HOTPOT_IMAGES[food.name] ? `../src/public${HOTPOT_IMAGES[food.name]}` : `../src/static/products/dish-${food.id}.jpg`, import.meta.url));
    res.writeHead(200, { 'Content-Type': 'image/jpeg', 'Cache-Control': 'public, max-age=3600', 'Access-Control-Allow-Origin': '*' }); res.end(image);
  } catch { send(res, 404, { error: 'Chưa có ảnh món' }); }
  return true;
}
