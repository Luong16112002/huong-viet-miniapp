# Render Free + PostgreSQL cloud

Backend runtime uses DATABASE_URL and PostgreSQL. No persistent disk is required.
SQLite is used only by the migration tool and isolated compatibility tests.
The frontend UI and existing API paths are preserved.

## Migration first

Create an external PostgreSQL cloud project on a free provider such as Neon.
Use a dedicated empty database and copy its connection string, including provider
TLS settings, into DATABASE_URL privately. Never commit connection credentials.
Stop local writers and keep a backup of both SQLite files on your computer.
With Node 24, from the project root:

```powershell
npm ci
node server/migrate-postgres.mjs --inspect
# Set DATABASE_URL privately in this terminal first.
npm run migrate:postgres
```

Migration copies every source table: foods, restaurant_tables, records (orders
and bookings), admin_catalog (promotions), notifications, reviews and audits.
Customers remain derived from their original stored records. PostgreSQL views
expose tables, bookings, orders, customers and promotions.
Matching rows are skipped on rerun; differing target rows cause rollback rather
than overwrite. Existing table areas, capacities and statuses are preserved.
Missing canonical tables are seeded to 500 across IN/SV/PR/T1/T2.
Run migration BEFORE starting the deployed backend to avoid seed conflicts with
historical table statuses.

## Render Free

Push this project to your repository, then create a Blueprint using render.yaml.
It selects a Free Docker Web Service with no disk. Configure in Render:

- DATABASE_URL: cloud PostgreSQL connection string.
- GEMINI_API_KEY: server-side secret.
- GEMINI_MODEL: gemini-2.5-flash or the model enabled for your key.
- CORS_ALLOWED_ORIGINS: actual Zalo WebView/preview Origins, comma separated.
- ADMIN_USERNAME and ADMIN_PASSWORD_HASH: administrator credentials.

Render supplies HTTPS. /api/health requires a successful PostgreSQL query.
Free services may sleep; allow for cold start before testing on the phone.
Records live in the external database and survive backend restarts.

## Verify and deploy Zalo

Open your actual backend's /api/health on your phone. Expect success=true and
database=true. Run against the real service:

```powershell
node scripts/check-production-api.mjs https://YOUR-BACKEND.onrender.com https://ACTUAL-ZALO-ORIGIN
```

This checks backend, database, 500 tables, AI configuration, CORS, home, menu and
availability. AI health proves key presence only. Send a real question through
/api/ai/chat to verify model access, key permissions and quota. Create a booking
and order, restart the backend, and verify those records remain.

Set .env.production to the actual backend origin, without a trailing slash:

```ini
VITE_API_BASE_URL=https://YOUR-BACKEND.onrender.com
```

Register that domain in Zalo's allowed API domains. Build with npm run build into
a clean output directory, then deploy with the project's Zalo CLI. Never publish
placeholder URLs. Production builds reject missing, HTTP and loopback API URLs
and audit the bundle for loopback addresses and Gemini secret variable names.
The temporary Diagnostics Panel is removed from the UI.

## Limits

Existing synchronous business rules use a dedicated PostgreSQL worker to preserve
transaction boundaries and API contracts. Queries block the request event loop;
this suits a small student deployment. Sustained high traffic would require
asynchronous repositories. Advisory locks serialize transactional inventory
writes across backend processes. No local file or fake inventory substitutes
for PostgreSQL at runtime.
