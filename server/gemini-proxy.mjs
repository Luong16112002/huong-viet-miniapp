import { transcribeRoute } from './voice-input.mjs';
import {createAIContextService} from './services/aiContextService.mjs';
import {contextChat} from './ai-context-chat.mjs';
import {getRestaurantContextSource} from './home-api.mjs';
import vouchers from './vouchers.json' with { type: 'json' };
﻿import http from 'node:http';
import { createFoodRepository } from './food-repository.mjs';
import { foodDetailChat } from './food-detail-ai.mjs';
import { foodAIError, logFoodAIError } from './food-ai-errors.mjs';
import { homeRoute } from './home-api.mjs';
import { bookingRoute } from './booking-api.mjs';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI } from '@google/genai';
import { menu } from './menu-context.mjs';
import { createCommerce } from './commerce.mjs';
import { corsHeaders } from './cors.mjs';
import { healthRoute } from './health-routes.mjs';
const envFile = fileURLToPath(new URL('./.env', import.meta.url));
if (process.env.NODE_ENV !== 'production' && existsSync(envFile)) process.loadEnvFile(envFile);
if (process.env.NODE_ENV === 'production' && !process.env.CORS_ALLOWED_ORIGINS?.trim())
  throw new Error('CORS_ALLOWED_ORIGINS is required in production');
const apiKey = process.env.GEMINI_API_KEY;
const configured = Boolean(apiKey && !apiKey.includes('PASTE_'));
const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const port = Number(process.env.PORT || process.env.GEMINI_PROXY_PORT || 8787);
console.log('[AI CONFIG]', configured);
const ai = configured ? new GoogleGenAI({ apiKey }) : null;
const foods = createFoodRepository(menu);
menu.splice(0, menu.length, ...foods.list());
const commerce = createCommerce({ menu, vouchers });
console.log('[DATABASE INVENTORY]', commerce.inventoryStats());
const liveFoods = {
  getById(id) { const item=menu.find(p=>String(p.id)===String(id)); if(!item||item.deleted||item.available===false)return null;const record=foods.getById(id);return {...item,...record,...Object.fromEntries(['id','name','price','description','category','categoryId','imageUrl','available','variantGroups'].filter(k=>item[k]!==undefined).map(k=>[k,item[k]]))}; },
  list() {return menu.filter(p=>!p.deleted&&p.available!==false).map(p=>liveFoods.getById(p.id));},
};
const aiContext=createAIContextService({menu,foods:liveFoods,commerce,restaurant:getRestaurantContextSource,vouchers});
const send = (res, status, body) => {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(status === 204 ? undefined : JSON.stringify(body));
};
const server = http.createServer(async (req, res) => {
  const headers = corsHeaders(req.headers.origin);
  if (!headers) return send(res, 403, { success: false, code: 'CORS_ERROR', message: 'Origin is not allowed' });
  for (const [key, value] of Object.entries(headers)) res.setHeader(key, value);
  if(req.method === 'OPTIONS') return send(res,204,{});
  if (healthRoute(req, res, send, { commerce, configured, model, menuItems: menu.length })) return;
  if(req.method === 'POST' && ['/api/ai/chat','/api/gemini','/api/ai/food-detail-chat','/api/ai/transcribe'].includes(req.url) && !configured)
    return send(res,503,{success:false,code:'AI_NOT_CONFIGURED',message:'Dịch vụ AI chưa được cấu hình.',error:'Dịch vụ AI chưa được cấu hình.'});
  if(req.method === 'GET' && req.url === '/api/tables') return send(res,200,commerce.listTables());
  if(await transcribeRoute(req,res,send,ai,model)) return;
  if(await homeRoute(req,res,send)) return;
  if(await bookingRoute(req,res,send,commerce.availability,commerce.availableTables)) return;
  if(req.method === 'POST' && req.url === '/api/bookings/create') req.url = '/api/commerce/reservations';
  if(await commerce.route(req,res,send)) return;
  if(req.method !== 'POST' || !['/api/ai/chat','/api/gemini','/api/ai/food-detail-chat'].includes(req.url)) return send(res,404,{success:false,error:'Not found'});
  try {
    let body = ''; for await (const chunk of req) { body += chunk; if(Buffer.byteLength(body)>100000) return send(res,413,{success:false,error:'Request too large'}); }
    let input; try { input = JSON.parse(body); } catch { throw Object.assign(new Error('Invalid JSON request'), { status: 400 }); }
    if(!input || typeof input.message !== 'string' || !input.message.trim() || input.message.length>4000) throw Object.assign(new Error('Message must contain 1–4000 characters'), { status: 400 });
    if(req.url === '/api/ai/food-detail-chat') {
      const result = await foodDetailChat(input,menu,async ({contents,schema,instruction}) => {
        if(!ai)throw Object.assign(new Error('Gemini API key is not configured'),{status:503,code:'AI_NOT_CONFIGURED'});
        return ai.models.generateContent({model,contents,config:{systemInstruction:instruction,responseMimeType:'application/json',responseSchema:schema,maxOutputTokens:2048,...(/^gemini-2\.5-flash/.test(model)?{thinkingConfig:{thinkingBudget:0}}:{}),httpOptions:{timeout:25000}}});
      }, liveFoods);
      return send(res,200,result);
    }
    const result=await contextChat(input,req.headers.authorization,aiContext,async ({contents,schema,instruction})=>{
      if(!ai)throw Object.assign(new Error('AI unavailable'),{status:503});
      console.log('[AI MODEL]',model);
      return ai.models.generateContent({model,contents,config:{systemInstruction:instruction,responseMimeType:'application/json',responseSchema:schema,maxOutputTokens:4096,...(/^gemini-2\.5-flash/.test(model)?{thinkingConfig:{thinkingBudget:0}}:{}),httpOptions:{timeout:25000}}});
    });
    send(res,200,result);
  } catch(error) {
    if (req.url === '/api/ai/food-detail-chat') {
      if (!error.foodAILogged) logFoodAIError(error);
      const failure = foodAIError(error);
      return send(res, failure.status, failure.body);
    }
    const status = Number(error.status || (String(error.message).match(/timeout|abort/i)?504:502));
    console.error(`[AI ERROR] status=${status}`);
    send(res,status>=400 && status<=599?status:502,{success:false,error:status===429?'AI đang chạm giới hạn lượt sử dụng. Vui lòng thử lại sau.':status===504?'AI phản hồi quá lâu. Vui lòng thử lại.':'AI đang tạm thời không phản hồi. Vui lòng thử lại.'});
  }
});
server.listen(port,'0.0.0.0',()=>console.log(`huong-viet-api listening on port ${port} | model=${model} | key configured=${configured} | menu=${menu.length}`));
