-- AgriChain Phase 9: PostgreSQL / Supabase Schema Definition
-- Mirrored from SQLite schema with PostgreSQL standard types, constraints, and indexes.

CREATE TABLE IF NOT EXISTS batches (
    batch_id      VARCHAR(66) PRIMARY KEY,
    crop_name     VARCHAR(100) NOT NULL,
    origin_farm   TEXT NOT NULL,
    harvest_date  VARCHAR(50) NOT NULL,
    farmer_name   VARCHAR(100) NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS custody_events (
    id            SERIAL PRIMARY KEY,
    batch_id      VARCHAR(66) NOT NULL REFERENCES batches(batch_id) ON DELETE CASCADE,
    from_holder   VARCHAR(100),
    to_holder     VARCHAR(100) NOT NULL,
    state         VARCHAR(50) NOT NULL,
    price_paise   BIGINT NOT NULL,
    tx_hash       VARCHAR(66),
    occurred_at   TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS readings (
    id            SERIAL PRIMARY KEY,
    batch_id      VARCHAR(66) NOT NULL REFERENCES batches(batch_id) ON DELETE CASCADE,
    temp_c        DOUBLE PRECISION NOT NULL,
    humidity_pct  DOUBLE PRECISION NOT NULL,
    verdict       VARCHAR(50) NOT NULL,
    tx_hash       VARCHAR(66),
    received_at   TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS quarantine (
    id            SERIAL PRIMARY KEY,
    reading_id    INTEGER NOT NULL REFERENCES readings(id) ON DELETE CASCADE,
    reason        TEXT NOT NULL,
    prev_hash     VARCHAR(100),
    entry_hash    VARCHAR(100),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS policy (
    crop_name     VARCHAR(100) PRIMARY KEY,
    min_temp_c    DOUBLE PRECISION NOT NULL,
    max_temp_c    DOUBLE PRECISION NOT NULL,
    min_humidity  DOUBLE PRECISION NOT NULL,
    max_humidity  DOUBLE PRECISION NOT NULL
);

CREATE TABLE IF NOT EXISTS telemetry_history (
    device_id     VARCHAR(100) NOT NULL,
    batch_id      VARCHAR(66) NOT NULL,
    timestamp     VARCHAR(50) NOT NULL,
    temperature   DOUBLE PRECISION NOT NULL,
    humidity      DOUBLE PRECISION NOT NULL,
    latitude      DOUBLE PRECISION NOT NULL,
    longitude     DOUBLE PRECISION NOT NULL,
    recorded_at   TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (device_id, batch_id)
);

CREATE TABLE IF NOT EXISTS audit_trail (
    audit_id      VARCHAR(100) PRIMARY KEY,
    batch_id      VARCHAR(66) NOT NULL,
    device_id     VARCHAR(100) NOT NULL,
    timestamp     VARCHAR(50) NOT NULL,
    latitude      DOUBLE PRECISION NOT NULL,
    longitude     DOUBLE PRECISION NOT NULL,
    temperature   DOUBLE PRECISION NOT NULL,
    humidity      DOUBLE PRECISION NOT NULL,
    event_hash    VARCHAR(100) NOT NULL,
    verdict       VARCHAR(50) NOT NULL,
    disposition   VARCHAR(50) NOT NULL,
    reason_codes  TEXT NOT NULL,
    anomaly_score DOUBLE PRECISION,
    processed_at  VARCHAR(50) NOT NULL,
    details       TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS replay_events (
    device_id     VARCHAR(100) NOT NULL,
    batch_id      VARCHAR(66) NOT NULL,
    event_hash    VARCHAR(100) NOT NULL,
    timestamp     VARCHAR(50) NOT NULL,
    recorded_at   TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (device_id, batch_id, event_hash)
);

CREATE TABLE IF NOT EXISTS replay_latest_timestamps (
    device_id        VARCHAR(100) NOT NULL,
    batch_id         VARCHAR(66) NOT NULL,
    latest_timestamp VARCHAR(50) NOT NULL,
    PRIMARY KEY (device_id, batch_id)
);

CREATE TABLE IF NOT EXISTS batch_documents (
    id            SERIAL PRIMARY KEY,
    batch_id      VARCHAR(66) NOT NULL REFERENCES batches(batch_id) ON DELETE CASCADE,
    doc_type      VARCHAR(50) NOT NULL,
    ipfs_cid      VARCHAR(100) NOT NULL,
    file_name     VARCHAR(255) NOT NULL,
    uploaded_at   TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    tx_hash       VARCHAR(66)
);

CREATE TABLE IF NOT EXISTS batch_reviews (
    id               SERIAL PRIMARY KEY,
    batch_id         VARCHAR(66) NOT NULL REFERENCES batches(batch_id) ON DELETE CASCADE,
    rating           INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment          TEXT,
    freshness_score  INTEGER,
    reviewer_address VARCHAR(42),
    created_at       TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
    id            SERIAL PRIMARY KEY,
    username      VARCHAR(100) UNIQUE NOT NULL,
    name          VARCHAR(150) NOT NULL,
    email         VARCHAR(150) UNIQUE NOT NULL,
    phone         VARCHAR(50),
    role          VARCHAR(50) NOT NULL,
    onchain_role  VARCHAR(50),
    address       VARCHAR(66) NOT NULL,
    status        VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    created_at    TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS spoilage_incidents (
    id                  SERIAL PRIMARY KEY,
    incident_id         VARCHAR(100) UNIQUE NOT NULL,
    batch_id            VARCHAR(66) NOT NULL REFERENCES batches(batch_id) ON DELETE CASCADE,
    crop_name           VARCHAR(100) NOT NULL,
    stage               VARCHAR(50) NOT NULL,
    failure_type        VARCHAR(100) NOT NULL,
    severity            VARCHAR(50) NOT NULL,
    loss_goods_kg       DOUBLE PRECISION NOT NULL,
    price_per_kg_paise  BIGINT NOT NULL,
    total_loss_paise    BIGINT NOT NULL,
    total_loss_inr      DOUBLE PRECISION NOT NULL,
    custodian_at_fault  VARCHAR(150) NOT NULL,
    details             TEXT NOT NULL,
    status              VARCHAR(50) NOT NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_custody_events_batch_id ON custody_events(batch_id);
CREATE INDEX IF NOT EXISTS idx_readings_batch_id ON readings(batch_id);
CREATE INDEX IF NOT EXISTS idx_quarantine_reading_id ON quarantine(reading_id);
CREATE INDEX IF NOT EXISTS idx_audit_trail_batch_id ON audit_trail(batch_id);
CREATE INDEX IF NOT EXISTS idx_batch_documents_batch_id ON batch_documents(batch_id);
CREATE INDEX IF NOT EXISTS idx_batch_reviews_batch_id ON batch_reviews(batch_id);
CREATE INDEX IF NOT EXISTS idx_spoilage_incidents_batch_id ON spoilage_incidents(batch_id);
