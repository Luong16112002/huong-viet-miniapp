import test from 'node:test';
import assert from 'node:assert/strict';
import { OUT_OF_SCOPE, foodRules, validateAnswer } from './ai-policy.mjs';
const menu = [{id:1,name:'Phở bò',price:65000}];
const output = (reply,recommendations=[]) => ({text:JSON.stringify({reply,recommendations})});
test('scope refusal is exact and cannot include recommendations',()=>assert.deepEqual(validateAnswer(output(OUT_OF_SCOPE,[{id:999,quantity:1}]),menu),{reply:OUT_OF_SCOPE,recommendations:[]}));
test('recommendations use server prices and preserve clarification',()=>{
 const result=validateAnswer(output('Món kèm từ thực đơn.',[{id:1,quantity:2,price:1}]),menu);
 assert.equal(result.recommendations[0].price,65000);
 assert.ok(result.reply.includes('130.000đ'));
 assert.ok(result.reply.startsWith('Món kèm'));
});
test('reject unknown, duplicate, unavailable dishes and invalid quantities',()=>{
 for(const items of [[{id:9,quantity:1}],[{id:1,quantity:0}],[{id:1,quantity:1.5}],[{id:1,quantity:21}],[{id:1,quantity:1},{id:1,quantity:1}]]) assert.throws(()=>validateAnswer(output('test',items),menu));
 assert.throws(()=>validateAnswer(output('test',[{id:1,quantity:1}]),[{...menu[0],availability:false}]));
});
test('reject malformed, empty and truncated replies',()=>{
 for(const response of [{text:'bad'},output(''),{text:'{}'},{...output('hello'),candidates:[{finishReason:'MAX_TOKENS'}]}]) assert.throws(()=>validateAnswer(response,menu));
});
test('missing menu is valid only without recommendations',()=>{
 assert.equal(validateAnswer(output('Chưa có thông tin thực đơn.'),[]).recommendations.length,0);
 assert.throws(()=>validateAnswer(output('test',[{id:1,quantity:1}]),[]));
 assert.ok(foodRules.includes('nhiễm chéo'));
});
