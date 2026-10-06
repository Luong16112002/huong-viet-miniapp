export function corsHeaders(origin, configuredOrigins = process.env.CORS_ALLOWED_ORIGINS || "") {
  const allowed = configuredOrigins.split(',').map(value => value.trim()).filter(Boolean);
  if (origin && allowed.length && !allowed.includes(origin)) return null;
  return {
    ...(origin ? { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Credentials': 'true' } : {}),
    Vary: 'Origin',
    'Access-Control-Allow-Headers': 'Content-Type, Accept, Authorization, Idempotency-Key',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Max-Age': '600',
  };
}
