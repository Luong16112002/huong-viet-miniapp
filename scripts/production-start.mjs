if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required; SQLite is not supported');
if (!process.env.CORS_ALLOWED_ORIGINS?.trim()) throw new Error('CORS_ALLOWED_ORIGINS is required');
await import('../server/gemini-proxy.mjs');
