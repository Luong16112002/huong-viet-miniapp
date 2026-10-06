import { randomBytes, scryptSync, timingSafeEqual, createHash } from 'node:crypto';
export function hashAdminPassword(password, salt = randomBytes(16).toString('hex')) {
  return `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
}
const digest = value => createHash('sha256').update(String(value)).digest();
export function createAdminAuth({username=process.env.ADMIN_USERNAME, passwordHash=process.env.ADMIN_PASSWORD_HASH, now=()=>Date.now()} = {}) {
  const sessions = new Map(), attempts = new Map();
  const configured = !!username && /^[a-f0-9]{32}:[a-f0-9]{128}$/.test(passwordHash || '');
  const fail = (message,status) => {throw Object.assign(new Error(message),{status});};
  function requireSession(req) {
    const token = String(req.headers.authorization || '').replace(/^Bearer /,'');
    const session = sessions.get(token);
    if (!session || session.expiresAt<=now()) {
      sessions.delete(token);
      fail('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',401);
    }
    return token;
  }
  return {
    requireSession,
    async route(req,res,send,path) {
      if (!['/api/admin/login','/api/admin/logout'].includes(path)) return false;
      if (req.method!=='POST') fail('Phương thức không được hỗ trợ.',405);
      if (path.endsWith('/logout')) { sessions.delete(requireSession(req)); send(res,200,{success:true}); return true; }
      if (!configured) fail('Chưa cấu hình tài khoản quản trị trên máy chủ.',503);
      const address = req.socket?.remoteAddress || 'local';
      for (const [id,entry] of attempts) if(entry.until<=now()) attempts.delete(id);
      const attempt = attempts.get(address) || {count:0,until:now()+60000};
      if (attempt.count>=8) fail('Bạn đã thử quá nhiều lần. Vui lòng thử lại sau một phút.',429);
      attempt.count++; attempts.set(address,attempt);
      let raw='';
      for await (const chunk of req) { raw+=chunk; if(Buffer.byteLength(raw)>4096) fail('Dữ liệu đăng nhập quá lớn.',413); }
      let input; try {input=JSON.parse(raw);} catch {fail('Thông tin đăng nhập không hợp lệ.',400);}
      if (!input || typeof input.username!=='string' || typeof input.password!=='string' || input.username.length>100 || input.password.length>1024) fail('Thông tin đăng nhập không hợp lệ.',400);
      const [salt,stored] = passwordHash.split(':');
      const passwordMatches = timingSafeEqual(scryptSync(input.password,salt,64),Buffer.from(stored,'hex'));
      if (!timingSafeEqual(digest(input.username.trim()),digest(username)) || !passwordMatches) fail('Tên đăng nhập hoặc mật khẩu không đúng.',401);
      attempts.delete(address);
      for(const [token,session] of sessions) if(session.expiresAt<=now()) sessions.delete(token);
      if(sessions.size>=1000) sessions.delete(sessions.keys().next().value);
      const token=randomBytes(32).toString('hex'),expiresAt=now()+8*3600000;
      sessions.set(token,{expiresAt});
      send(res,200,{success:true,token,expiresAt,username});
      return true;
    },
  };
}
