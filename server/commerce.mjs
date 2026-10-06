import { seedTables } from "./seed-tables.mjs";
import { createDomainViews } from "./postgres-views.mjs";
import { PostgresDatabase } from "./postgres-database.mjs";
import { normalizeFoodImage, normalizeOrderImages } from './food-images.mjs';
﻿import { createAdmin } from "./admin.mjs";
import { createNotificationRoutes } from "./notifications.mjs";
import { createReviewRoutes } from './reviews.mjs';
import { priceCart } from './cart-pricing.mjs';
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash, randomUUID } from 'node:crypto';
import { createZaloService, waitingNotification } from './zalo-service.mjs';

const invalid = message => { throw Object.assign(new Error(message), { status: 400 }); };
const text = (value, max = 500) => typeof value === 'string' ? value.trim().slice(0, max) : '';
export function createCommerce({ menu, vouchers = [], adminKey, filename, database, zalo = createZaloService() }) {
  if (process.env.NODE_ENV === 'production' && filename) throw new Error('SQLite is not supported in production');
  if (filename && filename !== ':memory:') mkdirSync(dirname(filename), { recursive: true });
  const db = database || (filename ? new DatabaseSync(filename) : new PostgresDatabase());
  db.exec('PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL; CREATE TABLE IF NOT EXISTS records (id TEXT PRIMARY KEY, owner TEXT NOT NULL, kind TEXT NOT NULL, request_key TEXT NOT NULL, fingerprint TEXT NOT NULL, data TEXT NOT NULL, UNIQUE(owner,kind,request_key));');
  const admin = createAdmin(db, { key: adminKey, menu, vouchers });
  if (db.dialect === "postgres") { seedTables(db); createDomainViews(db); }
  const notificationRoute = createNotificationRoutes(db);
  const reviewRoute = createReviewRoutes(db, menu);
  const save = record => db.prepare('UPDATE records SET data=? WHERE id=?').run(JSON.stringify(record), record.id);
  const list = (owner, kind) => db.prepare('SELECT data FROM records WHERE owner=? AND kind=? ORDER BY rowid DESC').all(owner, kind).map(row => { const record=JSON.parse(row.data); return kind === 'order' ? normalizeOrderImages(record, menu) : record; });
  function validate(kind, input) {
    const id = randomUUID(), createdAt = new Date().toISOString();
    const base = { id, createdAt, notification: waitingNotification(), note: text(input.note) };
    if (kind === 'reservation') {
      const { date, time, guests } = input;
      const area = ({ outdoor: 'garden', vip: 'private', trong_nha: 'indoor', san_vuon: 'garden', phong_rieng: 'private' })[input.area] || input.area;
      const when = Date.parse(`${date}T${time}:00+07:00`);
      const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date());
      const lastDay = new Date(`${today}T12:00:00Z`); lastDay.setUTCDate(lastDay.getUTCDate() + 30);
      const name = text(input.name, 80), phone = text(input.phone, 30).replace(/[\s().-]/g, '').replace(/^(\+84|84)/, '0');
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^(1\d|20):(00|30)$|^21:00$/.test(time) || !Number.isFinite(when) || new Date(when + 7*3600000).toISOString().slice(0,10) !== date || date > lastDay.toISOString().slice(0,10) || when < Date.now() + 1800000) invalid('Giờ đặt bàn không còn hợp lệ.');
      if (!Number.isInteger(guests) || guests < 1 || guests > 20 || !['indoor','garden','private','floor1','floor2'].includes(area)) invalid('Thông tin số khách hoặc không gian chưa hợp lệ.');
      if (name.length < 2 || !/^0[35789]\d{8}$/.test(phone)) invalid('Vui lòng kiểm tra họ tên và số điện thoại.');
      return { ...base, code: `HV-${id.slice(0,8).toUpperCase()}`, date, time, guests, area, name, phone, email: text(input.email, 150), status: 'pending' };
    }
    if (!['delivery','pickup','dinein'].includes(input.deliveryType) || !['cash','zalopay','momo','credit_card'].includes(input.paymentMethod)) invalid('Hình thức nhận món hoặc thanh toán không hợp lệ.');
    if (!Array.isArray(input.items) || !input.items.length || input.items.length > 100) invalid('Giỏ hàng không hợp lệ.');
    const { subtotal, shippingFee, discount, total, voucherCode, lines } = priceCart(menu, input, vouchers);
    const items = lines.map((line, index) => ({ ...line, id: `${id}-${index}`, note: text(input.items[index].note) }));
    const tableNumber = text(input.tableNumber, 30);
    const diningTable = input.deliveryType === "dinein" ? admin.tables().find(t => t.id === (input.tableId || tableNumber) && t.status !== "DISABLED") : undefined;
    if (input.deliveryType === "dinein" && !diningTable) invalid("Vui l\u00f2ng ch\u1ecdn m\u00e3 b\u00e0n h\u1ee3p l\u1ec7.");
    if (input.deliveryType === 'dinein' && !tableNumber) invalid('Vui lòng nhập số bàn hoặc mã bàn.');
    if (input.expectedTotal !== undefined && input.expectedTotal !== total) invalid('Giá món đã thay đổi. Vui lòng tải lại giỏ hàng.');
    const address = input.deliveryAddress;
    if (input.deliveryType === 'delivery' && (!text(address?.recipientName) || !text(address?.address) || !/^0[35789]\d{8}$/.test(text(address?.phoneNumber)))) invalid('Vui lòng nhập thông tin giao hàng và số điện thoại hợp lệ.');
    return { ...base, orderCode: `HV-${id.slice(0,8).toUpperCase()}`, items, tableId: diningTable?.id, customerName: text(input.customerName || input.deliveryAddress?.recipientName,80), phone: text(input.phone || input.deliveryAddress?.phoneNumber,30), tableNumber: input.deliveryType === 'dinein' ? tableNumber : undefined, voucherCode, deliveryType: input.deliveryType, deliveryTypeLabel: input.deliveryType === 'delivery' ? 'Giao hàng' : input.deliveryType === 'dinein' ? 'Phục vụ tại bàn' : 'Nhận tại quầy', deliveryAddress: address ? { recipientName: text(address.recipientName,80), phoneNumber: text(address.phoneNumber,20), address: text(address.address), city: text(address.city,80) } : undefined, state: 'pending', stateLabel: 'Đã ghi nhận, đang chờ xác nhận', totalAmount: total, payment: { method: input.paymentMethod, subtotal, shippingFee, discount, total, status: 'pending' }, canCancel: true, canPickup: false, canReorder: false };
  }
  async function route(req, res, send) {
    const path = new URL(req.url, 'http://localhost').pathname;
    if (await admin.route(req,res,send,path)) return true;
    if (!path.startsWith('/api/commerce/') && !path.startsWith('/api/notifications')) return false;
    try {
      if (path === '/api/commerce/menu' && req.method === 'GET') {send(res,200,menu.filter(p=>p.available!==false&&!p.deleted).map(normalizeFoodImage));return true;}
      if (path === '/api/commerce/config' && req.method === 'GET') { send(res,200,{ reservation: zalo.ready('reservation'), order: zalo.ready('order') }); return true; }
      const credential = req.headers.authorization?.replace(/^Bearer /, '') || '';
      if (!/^[a-f0-9]{64}$/.test(credential)) throw Object.assign(new Error('Thiếu mã truy cập lịch sử trên thiết bị.'), { status: 401 });
      const owner = createHash('sha256').update(credential).digest('hex');
      if (await notificationRoute(req,res,send,owner,path)) return true;
      if (await reviewRoute(req,res,send,owner,path)) return true;
      if (path === '/api/commerce/cart/quote' && req.method === 'POST') {
        let raw = ''; for await (const chunk of req) { raw += chunk; if (Buffer.byteLength(raw)>64000) invalid('Dữ liệu quá lớn.'); }
        let input; try { input = JSON.parse(raw); } catch { invalid('Dữ liệu không hợp lệ.'); }
        if (!input || typeof input !== 'object') invalid('Giỏ hàng không hợp lệ.');
        send(res,200,priceCart(menu,input,vouchers)); return true;
      }
      const [, , , collection, id, action] = path.split('/');
      const kind = collection === 'orders' ? 'order' : collection === 'reservations' ? 'reservation' : null;
      if (!kind) throw Object.assign(new Error('Không tìm thấy.'),{status:404});
      if (req.method === 'GET') {
        const records = list(owner,kind), record = id ? records.find(r=>r.id===id) : records;
        if (!record) throw Object.assign(new Error('Không tìm thấy yêu cầu.'),{status:404});
        send(res,200,record); return true;
      }
      if (req.method !== 'POST') throw Object.assign(new Error('Method not allowed'),{status:405});
      let raw = ''; for await (const chunk of req) { raw += chunk; if (Buffer.byteLength(raw)>64000) throw Object.assign(new Error('Dữ liệu quá lớn.'),{status:413}); }
      let input; try { input = JSON.parse(raw); } catch { invalid('Dữ liệu không hợp lệ.'); }
      if (!input || typeof input !== 'object' || Array.isArray(input)) invalid('Dữ liệu không hợp lệ.');
      if (id) {
        const record = list(owner,kind).find(r=>r.id===id);
        if (!record) throw Object.assign(new Error('Không tìm thấy yêu cầu.'),{status:404});
        if (action === 'cancel' && ['pending','confirmed'].includes(record.state || record.status)) {
          if (kind === 'order') Object.assign(record,{state:'cancelled',stateLabel:'Đã hủy',canCancel:false,canReorder:true});
          else record.status = 'cancelled';
        } else if (action === 'pickup' && kind === 'order' && record.state === 'ready' && record.deliveryType === 'pickup') Object.assign(record,{state:'completed',stateLabel:'Hoàn tất',canPickup:false,canReorder:true});
        else invalid('Không thể cập nhật yêu cầu ở trạng thái hiện tại.');
        record.updatedAt = new Date().toISOString();
        record.timeline = [...(record.timeline || [{at:record.createdAt,status:'pending',label:'Khách gửi yêu cầu'}]),{at:record.updatedAt,status:record.state||record.status,label:action==='cancel'?'Khách hủy yêu cầu':'Khách đã nhận món'}];
        save(record);
        if(kind==='reservation'&&action==='cancel'&&record.tableId)admin.release(record.tableId);
        send(res,200,record); return true;
      }
      const key = req.headers['idempotency-key'];
      if (typeof key !== 'string' || !/^[a-zA-Z0-9-]{16,80}$/.test(key)) invalid('Thiếu mã yêu cầu.');
      const { zaloProof, ...draft } = input;
      const fingerprint = createHash('sha256').update(JSON.stringify(draft)).digest('hex');
      const existing = db.prepare('SELECT data,fingerprint FROM records WHERE owner=? AND kind=? AND request_key=?').get(owner,kind,key);
      if (existing) { if(existing.fingerprint !== fingerprint) invalid('Mã yêu cầu đã được sử dụng.'); send(res,200,JSON.parse(existing.data)); return true; }
      db.exec('BEGIN IMMEDIATE');
      let record;
      try {
      record = validate(kind,draft);
      if(kind==='reservation') {
        const candidates=admin.suggestions({...record,durationMinutes:120});
        const selected=draft.selectedTableId || draft.tableId;
        const selectedRow=selected && admin.tables().find(t=>t.id===selected);
        if(selectedRow && selectedRow.capacity < record.guests) throw Object.assign(new Error('Bàn được chọn không đủ sức chứa.'),{status:409,code:'TABLE_TOO_SMALL'});
        const table=selected?candidates.find(t=>t.id===selected):draft.autoAssignTable===true?candidates[0]:null;
        if((selected||draft.autoAssignTable===true)&&!table) throw Object.assign(new Error('Bàn vừa được đặt hoặc không còn phù hợp. Vui lòng chọn bàn khác.'),{status:409});
        if(!table&&admin.tables().length) invalid('Vui lòng chọn bàn còn trống.');
        if(table) Object.assign(record,{tableId:table.id,tableName:table.name,durationMinutes:120});
      }
      if (kind === 'reservation' && list(owner,kind).some(r=>r.date===record.date && r.time===record.time && r.phone===record.phone && ['pending','confirmed'].includes(r.status))) invalid('Bạn đã có yêu cầu cho khung giờ này. Hãy kiểm tra lịch đặt bàn.');
      db.prepare('INSERT INTO records VALUES (?,?,?,?,?,?)').run(record.id,owner,kind,key,fingerprint,JSON.stringify(record));
      db.exec('COMMIT');
      } catch(error) {db.exec('ROLLBACK');throw error;}
      // The durable record exists before any external API call. Notification errors cannot undo it.
      try {
        const notification = await zalo.send(kind,record,zaloProof);
        const latest = JSON.parse(db.prepare('SELECT data FROM records WHERE id=?').get(record.id).data);
        latest.notification = notification; save(latest); send(res,201,latest);
      } catch { send(res,201,record); }
    } catch (error) { send(res,error.status || 500,{ success:false, ...(error.code ? {code:error.code}:{}), message:error.status ? error.message : 'Chưa lưu được yêu cầu. Vui lòng thử lại.', error: error.status ? error.message : 'Chưa lưu được yêu cầu. Vui lòng thử lại.' }); }
    return true;
  }
  return { listTables: () => admin.tables(), debugDatabase: () => db.prepare("SELECT 1 AS connected").get().connected === 1, inventoryStats: () => ({ tables: admin.tables().length, foods: menu.filter(p => !p.deleted && p.available !== false).length, bookings: db.prepare("SELECT COUNT(*) AS count FROM records WHERE kind='reservation'").get().count }), route, aiRecords: (owner,kind) => db.prepare('SELECT data FROM records WHERE owner=? AND kind=? ORDER BY rowid DESC LIMIT 5').all(owner,kind).map(r=>JSON.parse(r.data)), availableTables: input => admin.suggestions({...input,durationMinutes:120,area:({outdoor: 'garden', vip: 'private', trong_nha:'indoor',san_vuon:'garden',phong_rieng:'private'})[input.area]||input.area}).map(({id,name,area,capacity,status,active})=>({id,code:id,name,area,capacity,status,active})), availability: input => admin.tables().length ? admin.suggestions({...input,area:({outdoor: 'garden', vip: 'private', trong_nha:'indoor',san_vuon:'garden',phong_rieng:'private'})[input.area]||input.area}).length>0 : null, close: () => db.close() };
}


