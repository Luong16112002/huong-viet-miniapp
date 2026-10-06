import test from 'node:test';
import assert from 'node:assert/strict';
import {Readable} from 'node:stream';
import {createAdminAuth,hashAdminPassword} from './admin-auth.mjs';
test('username/password issue expiring session; wrong credentials and logout deny access',async()=>{
  let time=1000;
  const auth=createAdminAuth({username:'admin',passwordHash:hashAdminPassword('test-password'),now:()=>time});
  async function call(path,body,token='') {
    const req=Readable.from([JSON.stringify(body)]);req.method='POST';req.headers={authorization:'Bearer '+token};
    let result;await auth.route(req,{},(_res,status,data)=>{result={status,data}},path);return result;
  }
  await assert.rejects(call('/api/admin/login',{username:'wrong',password:'test-password'}),e=>e.status===401);
  await assert.rejects(call('/api/admin/login',{username:'admin',password:'wrong'}),e=>e.status===401);
  const login=await call('/api/admin/login',{username:'admin',password:'test-password'});
  assert.equal(login.status,200);assert.match(login.data.token,/^[a-f0-9]{64}$/);
  const req={headers:{authorization:'Bearer '+login.data.token}};
  assert.equal(auth.requireSession(req),login.data.token);
  await call('/api/admin/logout',{},login.data.token);
  assert.throws(()=>auth.requireSession(req),e=>e.status===401);
  const next=await call('/api/admin/login',{username:'admin',password:'test-password'});
  time=next.data.expiresAt;
  assert.throws(()=>auth.requireSession({headers:{authorization:'Bearer '+next.data.token}}),e=>e.status===401);
});
test('unconfigured credentials fail closed and repeated login attempts are limited',async()=>{
  const auth=createAdminAuth({username:'admin',passwordHash:hashAdminPassword('test-password')});
  const login=async service=>{const req=Readable.from(['{"username":"admin","password":"wrong"}']);req.method='POST';req.headers={};return service.route(req,{},()=>{},'/api/admin/login')};
  await assert.rejects(login(createAdminAuth({username:'',passwordHash:''})),e=>e.status===503);
  for(let i=0;i<8;i++)await assert.rejects(login(auth),e=>e.status===401);
  await assert.rejects(login(auth),e=>e.status===429);
});
