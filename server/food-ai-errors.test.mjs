import test from 'node:test';
import assert from 'node:assert/strict';
import { foodAIError, logFoodAIError } from './food-ai-errors.mjs';
import { foodDetailChat } from './food-detail-ai.mjs';
const food = {id:21,name:'Phở gà',price:59000,pairings:['quẩy','Trà chanh','Nước chanh','Trà nóng'],features:[]};
test('consultation provider failures propagate instead of returning raw database lists', async () => {
 for (const status of [400,401,403,429,500,503,504]) {
  await assert.rejects(()=>foodDetailChat({foodId:21,message:'Món này hợp với đồ uống nào?'},[food,{id:92,name:'Trà chanh',price:25000,categoryId:'drink'}],async()=>{throw Object.assign(new Error('provider failure'),{status});}),e=>e.status===status);
 }
 await assert.rejects(()=>foodDetailChat({foodId:21,message:'Món này hợp với đồ uống nào?'},[food,{id:92,name:'Trà chanh',price:25000,categoryId:'drink'}],async()=>({text:'invalid json'})));
});

test('no invented pairing or allergy advice when provider fails',async()=>{
 for (const [dish,message] of [[food,'Tôi dị ứng, nên uống gì?']]) {
  await assert.rejects(()=>foodDetailChat({foodId:21,message},[dish,{id:92,name:'Trà chanh',price:25000,categoryId:'drink'}],async()=>{throw Object.assign(new Error('quota'),{status:429});}),e=>e.status===429);
 }
});
test('error responses distinguish lookup, credentials, request, quota, server and timeout',()=>{
 for (const [error,code,status] of [[{status:404,code:'FOOD_NOT_FOUND'},'FOOD_NOT_FOUND',404],[{status:401},'AI_CONFIGURATION_ERROR',401],[{status:403},'AI_CONFIGURATION_ERROR',403],[{status:404},'AI_CONFIGURATION_ERROR',404],[{status:503,code:'AI_NOT_CONFIGURED'},'AI_CONFIGURATION_ERROR',503],[{status:400},'AI_BAD_REQUEST',400],[{status:429},'AI_RATE_LIMIT',429],[{status:500},'AI_SERVER_ERROR',500],[{status:503},'AI_UNAVAILABLE',503],[{message:'request timeout'},'AI_TIMEOUT',504]]) {
  const result=foodAIError(error); assert.equal(result.status,status); assert.equal(result.body.error,code); assert.ok(result.body.message); assert.equal(result.body.success,false);
 }
});
test('logs include error details while redacting API keys', t=>{
 const log=t.mock.method(console,'error',()=>{});
 logFoodAIError({status:403,code:'PERMISSION_DENIED',message:'key=AIzaTESTsecret https://example.invalid?key=secretvalue'});
 const [tag,detail]=log.mock.calls[0].arguments;
 assert.equal(tag,'[FOOD AI ERROR]'); assert.equal(detail.status,403); assert.equal(detail.code,'PERMISSION_DENIED'); assert.ok(!detail.message.includes('secretvalue')); assert.ok(!detail.message.includes('AIzaTESTsecret'));
});
