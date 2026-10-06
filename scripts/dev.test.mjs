import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {inspectService,resolveZmp} from './dev.mjs';
async function serve(body,contentType='application/json') {
 const server=http.createServer((req,res)=>{res.setHeader('Content-Type',contentType);res.end(body);});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 return {port:server.address().port,close:()=>new Promise(resolve=>server.close(resolve))};
}
test('recognizes healthy AI backend without starting a second process',async()=>{
 const s=await serve(JSON.stringify({configured:true,model:'gemini-test',menuItems:120}));
 try{assert.equal(await inspectService(s.port,'backend'),'ready');}finally{await s.close();}
 assert.equal(await inspectService(s.port,'backend'),'free');
});
test('does not mistake an unrelated service for the backend',async()=>{
 const s=await serve('{"ok":true}');try{assert.equal(await inspectService(s.port,'backend'),'occupied');}finally{await s.close();}
});
test('recognizes Zalo generated title with Vite runtime',async()=>{
 const s=await serve('<title>Nhà Hàng Hương Việt</title><script src="/@vite/client"></script>','text/html');
 try{assert.equal(await inspectService(s.port,'frontend'),'ready');}finally{await s.close();}
});
test('refuses a different frontend even if it also uses Vite',async()=>{
 const s=await serve('<title>Other app</title><script src="/@vite/client"></script>','text/html');
 try{assert.equal(await inspectService(s.port,'frontend'),'occupied');}finally{await s.close();}
});
