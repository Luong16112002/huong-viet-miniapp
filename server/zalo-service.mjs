// Server-only ZBS adapter. Never persist or return provider credentials.
export const waitingNotification = (reason = 'not_configured') => ({ status: 'pending', reason });
export function createZaloService(env = process.env, fetcher = fetch) {
  const ready = kind => Boolean(env.ZALO_OA_ACCESS_TOKEN && env.ZALO_APP_SECRET && env[`ZALO_${kind.toUpperCase()}_TEMPLATE_ID`]);
  return {
    ready,
    async send(kind, record, proof) {
      if (!ready(kind)) return waitingNotification();
      if (!proof?.accessToken || !proof?.phoneToken) return waitingNotification('recipient_unverified');
      try {
        const identity = await fetcher('https://graph.zalo.me/v2.0/me/info', {
          headers: { access_token: proof.accessToken, code: proof.phoneToken, secret_key: env.ZALO_APP_SECRET },
          signal: AbortSignal.timeout(6000),
        });
        const verified = await identity.json();
        if (!identity.ok || verified.error !== 0 || !/^84[35789]\d{8}$/.test(verified.data?.number || '')) return waitingNotification('recipient_unverified');
        // Send only to the account that explicitly shared its phone, never to an arbitrary form number.
        const fields = kind === 'reservation'
          ? { customer_name: record.name, booking_code: record.code, booking_date: record.date, booking_time: record.time, guests: String(record.guests), status: 'Đã ghi nhận, đang chờ xác nhận' }
          : { order_code: record.orderCode, amount: String(record.totalAmount), status: 'Đã ghi nhận, đang chờ xác nhận' };
        const mapping = JSON.parse(env[`ZALO_${kind.toUpperCase()}_TEMPLATE_FIELDS`] || '{}');
        const template_data = Object.fromEntries(Object.entries(fields).map(([key, value]) => [mapping[key] || key, value]));
        const response = await fetcher('https://business.openapi.zalo.me/message/template', {
          method: 'POST', headers: { 'Content-Type': 'application/json', access_token: env.ZALO_OA_ACCESS_TOKEN },
          body: JSON.stringify({ phone: verified.data.number, template_id: env[`ZALO_${kind.toUpperCase()}_TEMPLATE_ID`], template_data, tracking_id: record.id.replace(/-/g, '') }),
          signal: AbortSignal.timeout(8000),
        });
        const result = await response.json();
        if (response.ok && result.error === 0 && typeof result.data?.msg_id === 'string' && result.data.msg_id) {
          return { status: 'accepted', messageId: result.data.msg_id, acceptedAt: new Date().toISOString() };
        }
        return { ...waitingNotification('provider_rejected'), errorCode: Number.isFinite(result.error) ? result.error : undefined };
      } catch { return waitingNotification('provider_unavailable'); }
    },
  };
}
