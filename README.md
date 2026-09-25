# Vault — Fault-Tolerant Distributed Object Storage (Hackathon Prototype)

This package contains both halves of the project:

```
vault-fullstack/
├── backend/    # Node/Express/PostgreSQL API — see backend/README.md
└── frontend/   # Your existing React/Vite/Tailwind UI, now wired to the API
```

## Quick start

**1. Backend**

```bash
cd backend
npm install
cp .env.example .env        # edit DATABASE_URL to point at your Postgres
npm run db:init             # creates tables + seeds node-1..node-4
npm start                   # listens on http://localhost:3000
```

**2. Frontend**

```bash
cd frontend
npm install
npm run dev                 # http://localhost:5173
```

The frontend calls the API at `http://localhost:3000/api` by default. To
point it elsewhere, create `frontend/.env` with:

```
VITE_API_URL=http://localhost:3000/api
```

## What was connected

Every page that was a static placeholder now fetches real data and calls
the real endpoints, using only your existing UI components
(`Card`, `StatusBadge`, `MetricCard`, `Button`, `EmptyState`, `ActivityItem`,
`PageHeader`) — nothing was redesigned:

| Page | Wired to |
|---|---|
| Dashboard | `GET /api/metrics`, `GET /api/nodes`, `GET /api/activity` |
| Objects | `GET/POST /api/objects`, `GET /api/objects/:id/download` |
| Nodes | `GET /api/nodes`, `POST /api/nodes/:id/fail`, `POST /api/nodes/:id/recover` |
| Replication | `GET /api/replication` |
| Repairs | `GET /api/repairs`, `POST /api/repairs/:id/retry` |
| Integrity | `POST /api/integrity/verify/:objectId` |
| Activity | `GET /api/activity` |
| Failure Lab | fail/recover node, corrupt replica, verify integrity, trigger repair |

New frontend files: `frontend/src/lib/api.ts` (typed API client) and
`frontend/src/lib/status.ts` (maps backend status strings onto the
existing `StatusBadge` visual states).

See `backend/README.md` for the full API reference, schema, and an
explanation of how the self-healing repair flow works end to end.
