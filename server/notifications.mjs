export function createNotificationRoutes(db) {
  db.exec('CREATE TABLE IF NOT EXISTS notifications (id TEXT NOT NULL, owner TEXT NOT NULL, data TEXT NOT NULL, is_read INTEGER NOT NULL DEFAULT 0, deleted INTEGER NOT NULL DEFAULT 0, PRIMARY KEY(owner,id))');
  const insert = db.prepare('INSERT OR IGNORE INTO notifications(id,owner,data) VALUES (?,?,?)');
  function sync(owner) {
    for (const row of db.prepare('SELECT kind,data FROM records WHERE owner=?').all(owner)) {
      if (!['order','reservation'].includes(row.kind)) continue;
      const record = JSON.parse(row.data), booking = row.kind === 'reservation';
      const state = record.state || record.status;
      const labels = {pending:'đang chờ xác nhận',confirmed:'đã được xác nhận',checked_in:'đã check-in',preparing:'đang được chuẩn bị',ready:'đã sẵn sàng',serving:'đang được phục vụ',delivering:'đang giao',completed:'đã hoàn tất',cancelled:'đã hủy',rejected:'bị từ chối'};
      if (!labels[state]) continue;
      const name = booking ? 'Đặt bàn' : 'Đơn hàng';
      const id = `${record.id}:${state}`;
      insert.run(id,owner,JSON.stringify({id,type:booking?'booking':'order',tone:['cancelled','rejected'].includes(state)?'warning':state==='confirmed'?'success':undefined,title:`${name} ${labels[state]}`,message:`${name} #${record.orderCode || record.code || record.id} ${labels[state]}.`,createdAt:record.updatedAt || record.createdAt,action:{label:booking?'Xem lịch đặt bàn':'Xem đơn hàng',route:booking?'/order?tab=reservation':`/order/${record.id}`}}));
    }
  }
  return async (req,res,send,owner,path) => {
    if (!path.startsWith('/api/notifications')) return false;
    sync(owner);
    if (path === '/api/notifications' && req.method === 'GET') {
      const result=db.prepare('SELECT data,is_read FROM notifications WHERE owner=? AND deleted=0').all(owner).map(row=>({...JSON.parse(row.data),isRead:!!row.is_read})).sort((a,b)=>Date.parse(b.createdAt)-Date.parse(a.createdAt));
      send(res,200,result); return true;
    }
    if (path === '/api/notifications/read-all' && req.method === 'PUT') {
      db.prepare('UPDATE notifications SET is_read=1 WHERE owner=? AND deleted=0').run(owner);send(res,200,{success:true});return true;
    }
    const match=path.match(/^\/api\/notifications\/([^/]+)(\/read)?$/);
    if (!match || !((req.method==='PUT' && match[2]) || (req.method==='DELETE' && !match[2]))) {send(res,405,{error:'Thao tác không hợp lệ.'});return true;}
    const id=decodeURIComponent(match[1]);
    const result=db.prepare(`UPDATE notifications SET ${req.method==='DELETE'?'deleted=1':'is_read=1'} WHERE owner=? AND id=? AND deleted=0`).run(owner,id);
    send(res,result.changes?200:404,result.changes?{success:true}:{error:'Không tìm thấy thông báo.'});return true;
  };
}
