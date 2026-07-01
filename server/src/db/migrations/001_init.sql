-- ===========================================================================
-- 001_init — core schema for the Booking Tool
--
-- Conventions:
--   * All timestamps are stored as TIMESTAMPTZ (UTC on the wire). The app
--     displays them in the single business timezone.
--   * weekday follows JavaScript's Date.getDay(): 0 = Sunday ... 6 = Saturday.
-- ===========================================================================

-- btree_gist lets us combine the equality-friendly btree operators with the
-- range "overlaps" (&&) operator inside an exclusion constraint. That is what
-- enforces "no two confirmed bookings overlap" at the database level.
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- --- Admin users -----------------------------------------------------------
CREATE TABLE users (
  id            SERIAL PRIMARY KEY,
  email         TEXT        NOT NULL UNIQUE,
  password_hash TEXT        NOT NULL,
  role          TEXT        NOT NULL DEFAULT 'admin' CHECK (role IN ('admin')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- --- Services offered -------------------------------------------------------
CREATE TABLE services (
  id           SERIAL PRIMARY KEY,
  name         TEXT        NOT NULL,
  description  TEXT        NOT NULL DEFAULT '',
  duration_min INTEGER     NOT NULL CHECK (duration_min > 0),
  price_cents  INTEGER     NOT NULL DEFAULT 0 CHECK (price_cents >= 0),
  active       BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- --- Recurring weekly working hours ----------------------------------------
-- One row per open block per weekday, e.g. Mon 09:00-17:00.
CREATE TABLE availability (
  id         SERIAL PRIMARY KEY,
  weekday    SMALLINT NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  start_time TIME     NOT NULL,
  end_time   TIME     NOT NULL,
  CHECK (start_time < end_time)
);

CREATE INDEX idx_availability_weekday ON availability (weekday);

-- --- One-off blocked periods (holidays, breaks) ----------------------------
CREATE TABLE blackouts (
  id       SERIAL PRIMARY KEY,
  start_at TIMESTAMPTZ NOT NULL,
  end_at   TIMESTAMPTZ NOT NULL,
  reason   TEXT        NOT NULL DEFAULT '',
  CHECK (start_at < end_at)
);

CREATE INDEX idx_blackouts_range ON blackouts (start_at, end_at);

-- --- Bookings ---------------------------------------------------------------
CREATE TYPE booking_status AS ENUM ('confirmed', 'cancelled', 'completed');

CREATE TABLE bookings (
  id             SERIAL PRIMARY KEY,
  service_id     INTEGER        NOT NULL REFERENCES services (id),
  customer_name  TEXT           NOT NULL,
  customer_email TEXT           NOT NULL,
  customer_phone TEXT,
  note           TEXT,
  start_at       TIMESTAMPTZ    NOT NULL,
  end_at         TIMESTAMPTZ    NOT NULL,
  status         booking_status NOT NULL DEFAULT 'confirmed',
  cancel_token   TEXT           NOT NULL UNIQUE,
  created_at     TIMESTAMPTZ    NOT NULL DEFAULT now(),
  CHECK (start_at < end_at),

  -- Hard guarantee against double-booking: no two *confirmed* bookings may
  -- have overlapping time ranges. Cancelled/completed rows are exempt so a
  -- freed slot can be re-booked. This is the server-side race-condition guard
  -- the spec calls for — even if two requests pass the availability check
  -- concurrently, only one INSERT can commit.
  EXCLUDE USING gist (
    tstzrange(start_at, end_at) WITH &&
  ) WHERE (status = 'confirmed')
);

CREATE INDEX idx_bookings_start_at ON bookings (start_at);
CREATE INDEX idx_bookings_status ON bookings (status);
CREATE INDEX idx_bookings_service_id ON bookings (service_id);
