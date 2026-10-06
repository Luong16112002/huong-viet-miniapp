import { spawn } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { createConnection } from 'node:net';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const title = readFileSync(path.join(root, 'src/index.html'), 'utf8').match(/<title>(.*?)<\/title>/)?.[1];

export function portOpen(port) {
  return new Promise(resolve => {
    const socket = createConnection({host:'127.0.0.1',port});
    const finish = value => { socket.destroy(); resolve(value); };
    socket.once('connect',()=>finish(true));
    socket.once('error',()=>finish(false));
    socket.setTimeout(1500,()=>finish(true));
  });
}
export async function inspectService(port, kind) {
  if (!await portOpen(port)) return 'free';
  try {
    const response = await fetch(`http://127.0.0.1:${port}${kind==='backend'?'/api/ai/health':'/'}`,{signal:AbortSignal.timeout(2500)});
    if (!response.ok) return 'occupied';
    if (kind==='backend') {
      const info = await response.json();
      return typeof info.configured==='boolean' && typeof info.model==='string' && Number.isInteger(info.menuItems) ? 'ready' : 'occupied';
    }
    const html = await response.text();
    return title && (html.includes(`<title>${title}</title>`) || html.includes(`<title>${title.split(' · ')[0]}</title>`)) && html.includes('/@vite/client') ? 'ready' : 'occupied';
  } catch { return 'occupied'; }
}
export function resolveZmp() {
  const candidates = [path.join(root,'node_modules/zmp-cli/index.js')];
  for(const dir of (process.env.PATH||'').split(path.delimiter)) {
    candidates.push(path.join(dir,'node_modules/zmp-cli/index.js'));
    candidates.push(path.resolve(dir,'../lib/node_modules/zmp-cli/index.js'));
  }
  const found=candidates.find(existsSync);
  if(!found)throw new Error('Không tìm thấy Zalo CLI. Dùng npm run dev để chạy Vite hoặc cài zmp-cli.');
  return found;
}

export async function main() {
  // Read only the port here. Never load the API key into the frontend process.
  const envFile=path.join(root,'server/.env');
  const filePort=existsSync(envFile)?readFileSync(envFile,'utf8').match(/^GEMINI_PROXY_PORT\s*=\s*["']?(\d+)/m)?.[1]:undefined;
  const backendPort=Number(process.env.GEMINI_PROXY_PORT||filePort||8787);
  if(!Number.isInteger(backendPort)||backendPort<1||backendPort>65535)throw new Error('GEMINI_PROXY_PORT không hợp lệ.');
  const services=[{name:'Backend',kind:'backend',port:backendPort,args:['server/gemini-proxy.mjs']},{name:'Frontend',kind:'frontend',port:3000,args:[]}];
  for(const service of services) {
    service.state=await inspectService(service.port,service.kind);
    if(service.state==='occupied')throw new Error(`Cổng ${service.port} đang được dịch vụ khác hoặc phiên chưa sẵn sàng sử dụng. Không tự dừng tiến trình này. Hãy đóng đúng phiên cũ rồi chạy lại.`);
  }
  const frontend=services[1];
  if(frontend.state==='free')frontend.args=process.argv.includes('--zmp')?[resolveZmp(),'start','--no-frame']:['node_modules/vite/bin/vite.js','--host','0.0.0.0','--port','3000'];
  const owned=new Set();let stopping=false;
  async function shutdown(code=0) {
    if(stopping)return;stopping=true;
    await Promise.all([...owned].map(child=>new Promise(resolve=>{
      if(!child.pid||child.exitCode!==null||child.signalCode){resolve();return;}
      if(process.platform==='win32') {
        // Only terminate descendants of processes created by this invocation.
        const killer=spawn('taskkill',['/pid',String(child.pid),'/T','/F'],{stdio:'ignore',windowsHide:true,shell:false});
        killer.once('error',()=>{child.kill();resolve();});killer.once('exit',resolve);
      } else { try{process.kill(-child.pid,'SIGTERM');}catch{} resolve(); }
    })));
    process.exitCode=code;
  }
  process.once('SIGINT',()=>shutdown());process.once('SIGTERM',()=>shutdown());
  try {
    for(const service of services) {
      if(service.state==='ready'){console.log(`${service.name} đang chạy tại http://localhost:${service.port} — dùng phiên hiện có.`);continue;}
      if(stopping)return;
      console.log(`Đang khởi động ${service.name} trên cổng ${service.port}...`);
      const child=spawn(process.execPath,service.args,{cwd:root,stdio:'inherit',shell:false,windowsHide:true,detached:process.platform!=='win32'});
      owned.add(child);
      let failed=false;
      child.once('error',error=>{failed=true;console.error(`Không mở được ${service.name}: ${error.message}`);void shutdown(1);});
      child.once('exit',(code,signal)=>{failed=true;if(!stopping){console.log(`${service.name} đã dừng (${code??signal}).`);void shutdown(code===0?0:1);}});
      const deadline=Date.now()+45000;
      while(!stopping&&!failed&&Date.now()<deadline) {
        if(await inspectService(service.port,service.kind)==='ready')break;
        await new Promise(resolve=>setTimeout(resolve,300));
      }
      if(stopping||failed)return;
      if(await inspectService(service.port,service.kind)!=='ready')throw new Error(`${service.name} chưa sẵn sàng sau 45 giây.`);
    }
    console.log('Ứng dụng sẵn sàng: http://localhost:3000');
    if(!owned.size)console.log('Không mở thêm tiến trình. Các phiên hiện có tiếp tục chạy.');
    else console.log('Ctrl+C dừng những dịch vụ được mở bởi lệnh này; giữ nguyên dịch vụ đã chạy trước đó.');
  }catch(error){await shutdown(1);throw error;}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href) {
 main().catch(error=>{console.error(error.message);process.exitCode=1;});
}
