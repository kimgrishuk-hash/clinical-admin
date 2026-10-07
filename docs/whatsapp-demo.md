# WhatsApp free demo

Open `whatsapp-demo.html` using a static HTTP server, or log into the existing clinic application and open עוזר המרפאה. The demo uses the same engine in both places, makes no network requests, and stores configuration and conversations only in page memory. Refresh clears everything. Use fictional data only.

Supported: six menu options, appointment request collection (no actual scheduling), editable approved clinic details/prices, urgent routing, human handoff, simulated staff reply and explicit bot resume. Unset hours/address are labeled as unknown, unset prices route to staff. No AI provider, WhatsApp transport, credentials or subscriptions are required. Medical questions route to staff.

Run engine checks: `node --test tests/whatsapp-bot.test.cjs`.

Before live operation: obtain clinic approval and confirm the current Meta rate card in the actual business account; verify number coexistence, provision an official test number and webhook, authenticate staff, persist per-customer states and requests server-side, verify webhook signatures, deduplicate inbound messages, enforce reply windows and opt-in/template rules, and connect a real staff queue. Never reuse browser memory for live customer state. RapidVET scheduling integration is not implemented.

This demo is a foundation, not an active connection to 052-215-5032. Costs only become relevant when real external services are explicitly activated.
