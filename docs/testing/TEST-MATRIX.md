# oneCMS Test Matrix

The following matrix maps the critical system paths to their respective testing layer and coverage expectations.

| Feature Area | Unit (Vitest) | Integration (Vitest+Mongo) | E2E (Playwright) | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Authentication** | Passwords/Hash utils | Session creation/validation | Signup -> Login -> Dashboard | 🟢 Implemented |
| **Tenant Context** | Middleware extraction | Cross-Tenant API Rejection | Concurrent multi-user auth | 🟢 Implemented |
| **RBAC** | Permission matching | Route Guard Denials | UI Hide/Show based on Role | 🟢 Implemented |
| **Cache (Redis)** | Key Generation Isolation | High-concurrency isolation | N/A | 🟢 Implemented |
| **Database Limits** | Pagination utilities | Operator Injection bounds | N/A | 🟢 Implemented |
| **Frontend State** | Zustand pure actions | N/A | App Shell persistence | 🟢 Implemented |
| **Data Fetching** | React Query Hooks | N/A | Cache invalidation on mutation| 🟢 Implemented |
| **CMS Entities** | Validation Schemas | CRUD Route Operations | Editor Autosave & Publishing | 🟢 Implemented |
| **AI Workflows** | BullMQ Job formatting | Queue submission & Polling | Content Gen -> Insert to Editor| 🔴 Pending |

## Definitions
- **Unit**: Fast, isolated pure functions, utilities, and components.
- **Integration**: Database operations, memory servers, Redis boundaries, API route validation.
- **E2E**: Full browser execution spanning client, network, and real backend logic.
