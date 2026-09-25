# Vault Backend

Node.js / Express / PostgreSQL backend for **Vault**, a fault-tolerant
distributed object storage prototype. Storage nodes are simulated as
directories on disk (`storage/node-1` … `storage/node-4`); replication,
failure detection, repair and integrity verification are all real and
performed against those directories + a PostgreSQL metadata store.

## 1. Prerequisites

- Node.js 18+
- A running PostgreSQL instance (local, Docker, or hosted)

## 2. Setup

```bash
cd backend
npm install
cp .env.example .env
# edit .env and set DATABASE_URL to your Postgres connection string
```

Create the database (if it doesn't exist yet):

```bash
createdb vault
# or: psql -U postgres -c "CREATE DATABASE vault;"
```

Apply the schema and seed the initial 4-node cluster:

```bash
npm run db:init
```

This runs `database/schema.sql` against your database and inserts
`node-1` … `node-4`, all `HEALTHY`, and creates the matching
`storage/node-*` directories if they don't exist.

## 3. Run the backend

```bash
npm start        # node src/server.js
# or, for auto-restart on file changes:
npm run dev
```

The API listens on `http://localhost:3000` by default (`PORT` in `.env`).
CORS is configured to allow requests from `FRONTEND_ORIGIN`
(default `http://localhost:5173`, i.e. the Vite dev server).

## 4. Run the frontend against it

From the frontend project root:

```bash
npm install
npm run dev
```

The frontend's API client (`src/lib/api.ts`) reads `VITE_API_URL`
(defaults to `http://localhost:3000/api`) — set it in a `.env` file in the
frontend project if your backend runs elsewhere.

## 5. Project structure

```
backend/
├── src/
│   ├── server.js            # entrypoint: connects DB, starts Express
│   ├── app.js                # Express app, middleware, route mounting
│   ├── config/
│   │   ├── database.js       # pg Pool + query/withTransaction helpers
│   │   └── initDb.js         # applies schema.sql + seeds nodes (npm run db:init)
│   ├── routes/                # thin route definitions only
│   ├── controllers/           # req/res handling, calls into services
│   ├── services/               # ALL business logic lives here
│   │   ├── objectService.js       # upload / list / details / download
│   │   ├── nodeService.js         # node CRUD, fail/recover, storage dirs
│   │   ├── replicationService.js  # desired vs healthy vs missing replicas
│   │   ├── repairService.js       # auto-repair engine
│   │   ├── integrityService.js    # checksum verification + corruption sim
│   │   ├── healthService.js       # /api/metrics aggregation
│   │   └── activityService.js     # activity log read/write
│   ├── middleware/
│   │   ├── errorHandler.js    # ApiError, asyncHandler, central error JSON
│   │   └── uploadMiddleware.js# multer (memory storage)
│   └── utils/
│       ├── checksum.js        # SHA-256 (buffer + streamed file)
│       └── logger.js
├── storage/
│   ├── node-1/ … node-4/      # simulated storage nodes (real files land here)
├── database/
│   └── schema.sql
├── package.json
└── .env.example
```

## 6. API reference

All responses are JSON. Errors: `{ "success": false, "error": "..." }`
with an appropriate status code (400/404/409/500).

| Method | Path | Description |
|---|---|---|
| GET  | `/api/health` | Liveness check |
| POST | `/api/objects/upload` | Multipart upload (`file` field, optional `replicationFactor`) |
| GET  | `/api/objects` | List all objects |
| GET  | `/api/objects/:id` | Object details incl. replica locations/health |
| GET  | `/api/objects/:id/download` | Download from any healthy replica (auto-fallback) |
| GET  | `/api/nodes` | List nodes |
| GET  | `/api/nodes/:id` | Node details |
| POST | `/api/nodes/:id/fail` | Simulate node failure |
| POST | `/api/nodes/:id/recover` | Recover a failed node |
| GET  | `/api/replication` | Replication factor, healthy/total replicas, objects at risk, distribution |
| GET  | `/api/repairs` | List repair jobs |
| GET  | `/api/repairs/:id` | Repair job details |
| POST | `/api/repairs/:id/retry` | Retry a FAILED repair |
| POST | `/api/integrity/verify/:objectId` | Verify checksums for every replica of an object |
| POST | `/api/integrity/corrupt/:objectId/:nodeId` | **Demo only** — corrupt a replica's bytes on disk |
| GET  | `/api/activity` | Recent activity log (`?limit=`, `?eventType=`) |
| GET  | `/api/metrics` | Cluster-wide dashboard metrics |

### Upload example

```bash
curl -F "file=@project.zip" -F "replicationFactor=3" \
  http://localhost:3000/api/objects/upload
```

```json
{
  "success": true,
  "id": "5f2c...",
  "name": "project.zip",
  "size": 123456,
  "checksum": "a1b2...",
  "replicationFactor": 3,
  "status": "HEALTHY",
  "replicas": ["node-1", "node-2", "node-3"]
}
```

## 7. How self-healing works (end-to-end)

1. **Upload** picks the least-loaded healthy nodes and physically writes a
   copy of the file into each one's directory, then records a `replicas`
   row per copy.
2. **Fail a node** (`POST /api/nodes/:id/fail`) marks it `FAILED` and every
   replica living on it `UNAVAILABLE`. This immediately re-runs failure
   detection across all objects and queues repairs for any that dropped
   below their replication factor.
3. **Repair** finds a still-healthy replica as the source, picks a healthy
   node that doesn't already hold a copy as the target, copies the bytes,
   re-hashes the copy, and only marks it `HEALTHY` if the SHA-256 matches
   the object's recorded checksum. One active repair per object is
   enforced at the database level (partial unique index on
   `repairs(object_id) WHERE status IN ('QUEUED','RUNNING')`), so
   concurrent triggers won't double-repair.
4. **Integrity verification** (`POST /api/integrity/verify/:objectId`)
   re-hashes every replica currently believed healthy and flags mismatches
   as `CORRUPTED`, which also queues a repair.
5. **Corruption simulation** (`POST /api/integrity/corrupt/:objectId/:nodeId`)
   flips random bytes in a replica's file on disk — for the Failure Lab UI
   — then immediately runs verification and repair so you can watch the
   whole detect → repair → heal cycle.

## 8. Notes

- This is a hackathon prototype: repairs run in-process (`fire and forget`)
  rather than via a real job queue, and there's no distributed consensus —
  by design, per the project brief.
- Object bytes are buffered in memory during upload (multer memoryStorage)
  before being written to each target node directory; fine for demo-sized
  files, not meant for very large objects.
