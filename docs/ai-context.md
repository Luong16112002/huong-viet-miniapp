# AI Chef context

`server/services/aiContextService.mjs` routes questions to restaurant, food, drink, recommendation, order, booking, availability, cart or promotion data. `server/ai-context-chat.mjs` generates answers and returns server-controlled navigation actions. The existing food-detail endpoint retains its specialized analysis and uses the same live food repository.

Private records require the existing commerce Bearer token. Its SHA-256 owner is used in SQLite queries; client-supplied user IDs are not trusted. Only five recent records are projected, without phone numbers, delivery addresses or notification payloads. No token or private context is logged.

The cart is held on the device, not in a server cart table. Requests send IDs, quantities and selected options; the backend recalculates prices and voucher eligibility. Restaurant data comes from the same configured source as `/api/home`. Membership points are unavailable and are not inferred.

Session memory is keyed by owner and session ID, expires after 30 minutes, and is capped at 1,000 sessions. History is limited to ten messages. Clearing chat rotates the session. Restarting the backend clears memory; clients continue sending their recent conversation and preferences.

Availability requires valid date, time, party size and area. It uses Admin inventory, returns at most twelve matching tables plus the total count, and does not reserve a table. Booking creation still rechecks conflicts transactionally.

Prices for direct price questions are deterministic. Recommendation IDs, quantities and combo totals are validated against live menu prices after generation. General prose is model-generated and cannot be guaranteed hallucination-free; factual context, explicit missing-data rules and server-controlled actions constrain it. Actions only navigate: they do not create orders or bookings automatically.

Validation: `node --test server/ai-context.test.mjs server/chef-engine.test.mjs server/ai-policy.test.mjs server/food-detail-ai.test.mjs`.
