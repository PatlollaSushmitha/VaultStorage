-- Vault database schema
-- Run this once against your PostgreSQL database to create the required tables.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================================================
-- NODES
-- =========================================================
CREATE TABLE IF NOT EXISTS nodes (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  node_name        VARCHAR(100) NOT NULL UNIQUE,
  status           VARCHAR(20) NOT NULL DEFAULT 'HEALTHY'
                     CHECK (status IN ('HEALTHY', 'DEGRADED', 'FAILED', 'RECOVERING')),
  storage_capacity BIGINT NOT NULL DEFAULT 10737418240, -- 10 GB default
  storage_used     BIGINT NOT NULL DEFAULT 0,
  last_heartbeat   TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =========================================================
-- OBJECTS
-- =========================================================
CREATE TABLE IF NOT EXISTS objects (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  object_name          VARCHAR(500) NOT NULL,
  size                 BIGINT NOT NULL,
  checksum             VARCHAR(64) NOT NULL,
  version              INTEGER NOT NULL DEFAULT 1,
  replication_factor   INTEGER NOT NULL DEFAULT 3,
  status               VARCHAR(20) NOT NULL DEFAULT 'HEALTHY'
                          CHECK (status IN ('HEALTHY', 'AT_RISK', 'CRITICAL', 'LOST')),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_objects_name ON objects (object_name);
CREATE INDEX IF NOT EXISTS idx_objects_status ON objects (status);

-- =========================================================
-- REPLICAS
-- =========================================================
CREATE TABLE IF NOT EXISTS replicas (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  object_id    UUID NOT NULL REFERENCES objects(id) ON DELETE CASCADE,
  node_id      UUID NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
  version      INTEGER NOT NULL DEFAULT 1,
  checksum     VARCHAR(64) NOT NULL,
  status       VARCHAR(20) NOT NULL DEFAULT 'HEALTHY'
                 CHECK (status IN ('HEALTHY', 'UNAVAILABLE', 'CORRUPTED', 'VERIFIED', 'REPAIRING')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (object_id, node_id)
);

CREATE INDEX IF NOT EXISTS idx_replicas_object_id ON replicas (object_id);
CREATE INDEX IF NOT EXISTS idx_replicas_node_id ON replicas (node_id);
CREATE INDEX IF NOT EXISTS idx_replicas_status ON replicas (status);

-- =========================================================
-- REPAIRS
-- =========================================================
CREATE TABLE IF NOT EXISTS repairs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  object_id        UUID NOT NULL REFERENCES objects(id) ON DELETE CASCADE,
  source_node_id   UUID REFERENCES nodes(id) ON DELETE SET NULL,
  target_node_id   UUID REFERENCES nodes(id) ON DELETE SET NULL,
  status           VARCHAR(20) NOT NULL DEFAULT 'QUEUED'
                      CHECK (status IN ('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED')),
  progress         INTEGER NOT NULL DEFAULT 0,
  started_at       TIMESTAMPTZ,
  completed_at     TIMESTAMPTZ,
  error_message    TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_repairs_object_id ON repairs (object_id);
CREATE INDEX IF NOT EXISTS idx_repairs_status ON repairs (status);

-- Only one active (QUEUED or RUNNING) repair per object at a time.
CREATE UNIQUE INDEX IF NOT EXISTS uniq_active_repair_per_object
  ON repairs (object_id)
  WHERE status IN ('QUEUED', 'RUNNING');

-- =========================================================
-- ACTIVITIES
-- =========================================================
CREATE TABLE IF NOT EXISTS activities (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type   VARCHAR(50) NOT NULL,
  message      TEXT NOT NULL,
  object_id    UUID REFERENCES objects(id) ON DELETE SET NULL,
  node_id      UUID REFERENCES nodes(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activities_created_at ON activities (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_event_type ON activities (event_type);

-- =========================================================
-- updated_at trigger helper
-- =========================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_nodes_updated_at ON nodes;
CREATE TRIGGER trg_nodes_updated_at BEFORE UPDATE ON nodes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_objects_updated_at ON objects;
CREATE TRIGGER trg_objects_updated_at BEFORE UPDATE ON objects
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_replicas_updated_at ON replicas;
CREATE TRIGGER trg_replicas_updated_at BEFORE UPDATE ON replicas
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_repairs_updated_at ON repairs;
CREATE TRIGGER trg_repairs_updated_at BEFORE UPDATE ON repairs
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
