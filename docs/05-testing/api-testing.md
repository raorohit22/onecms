# API Testing

Use Vitest + Supertest.

Each endpoint should test:
- happy path
- authentication failure
- authorization failure
- validation failure
- not found/conflict cases
- dependency failure where meaningful
- response contract
- persistence side effects

Important API workflows should be traceable to FR identifiers.

We test the API foundation (middlewares, routes) using Supertest against the exported `createApp()` from `app.ts` to avoid binding to an actual port.
