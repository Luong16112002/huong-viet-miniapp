export function healthRoute(req, res, send, { commerce, configured, model, menuItems }) {
  if (req.method !== 'GET') return false;
  const path = new URL(req.url, 'http://backend.internal').pathname;
  if (path === '/api/ai/health') {
    send(res, 200, { success: true, configured: Boolean(configured), model, menuItems });
    return true;
  }
  if (!['/api/health', '/api/db/health', '/api/debug/db', '/api/debug/tables'].includes(path)) return false;
  try {
    if (path === '/api/debug/tables') {
      send(res, 200, { success: true, count: commerce.inventoryStats().tables });
    } else {
      if (commerce.debugDatabase() !== true) throw new Error('Database unavailable');
      send(res, 200, path === '/api/health'
        ? { success: true, service: 'huong-viet-api', status: 'ok', timestamp: new Date().toISOString(), database: true }
        : { success: true, connected: true });
    }
  } catch {
    send(res, 503, { success: false, service: 'huong-viet-api', status: 'unavailable',
      ...(path === '/api/health' ? { database: false } : { connected: false }),
      code: 'DATABASE_UNAVAILABLE', message: 'Database check failed' });
  }
  return true;
}
