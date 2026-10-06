import { apiFetch } from "@/services/apiClient";
import { getAccessToken, getPhoneNumber } from 'zmp-sdk';
export interface NotificationState { status: 'pending' | 'accepted'; reason?: string; messageId?: string }
export function notificationText(notification?: NotificationState) {
  return notification?.status === 'accepted' && notification.messageId
    ? 'Zalo đã tiếp nhận thông báo. Yêu cầu vẫn đang chờ nhà hàng xác nhận.'
    : 'Đã ghi nhận, đang chờ xác nhận';
}
const base = ('/api/commerce').replace(/\/$/, '');
export function ownerToken() {
  let token = localStorage.getItem('huong-viet-commerce-access');
  if (!token) {
    token = Array.from(crypto.getRandomValues(new Uint8Array(32)), b => b.toString(16).padStart(2,'0')).join('');
    localStorage.setItem('huong-viet-commerce-access', token);
  }
  return token;
}
export async function commerceRequest<T>(path: string, body?: unknown, key?: string): Promise<T> {
  const url = path === 'reservations' && body !== undefined ? `${base.replace(/\/commerce$/, '')}/bookings/create` : `${base}/${path}`;
  const response = await apiFetch(url, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ownerToken()}`, ...(key ? { 'Idempotency-Key': key } : {}) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    signal: AbortSignal.timeout(25000),
  }).catch(() => { throw new Error('Chưa kết nối được với nhà hàng. Vui lòng thử lại; giỏ hàng vẫn được giữ.'); });
  const result = await response.json().catch(() => { throw new Error('Máy chủ chưa sẵn sàng. Vui lòng thử lại.'); });
  if (!response.ok) throw new Error(result.error || 'Chưa lưu được yêu cầu. Vui lòng thử lại.');
  return result;
}
async function optionalZaloProof(kind: 'order' | 'reservation') {
  if (!/Zalo/i.test(navigator.userAgent)) return undefined;
  try {
    const config = await commerceRequest<Record<string,boolean>>('config');
    if (!config[kind]) return undefined;
    const { token } = await getPhoneNumber();
    if (!token) return undefined;
    return { phoneToken: token, accessToken: await getAccessToken() };
  } catch { return undefined; }
}
export async function createCommerceRecord<T>(kind: 'order' | 'reservation', draft: unknown): Promise<T> {
  // A lost response or reload retries the same request instead of creating another order.
  const storageKey = `huong-viet-pending-${kind}`;
  const fingerprint = JSON.stringify(draft);
  let pending: { fingerprint: string; key: string } | null = null;
  try { pending = JSON.parse(localStorage.getItem(storageKey) || 'null'); } catch { /* replace invalid cache */ }
  if (!pending || pending.fingerprint !== fingerprint) {
    pending = { fingerprint, key: crypto.randomUUID() };
    localStorage.setItem(storageKey, JSON.stringify(pending));
  }
  const zaloProof = await optionalZaloProof(kind);
  const result = await commerceRequest<T>(kind === 'order' ? 'orders' : 'reservations', { ...(draft as object), zaloProof }, pending.key);
  try { localStorage.removeItem(storageKey); } catch { /* server has saved the record */ }
  return result;
}
