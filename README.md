# Booking Tool

A self-serve booking / reservation web app for small service businesses.
Customers pick a service and an available time slot and get a confirmation
email; the owner manages services, availability, and bookings from an admin
area.

> **Status:** in progress. Skeleton + data model are in place.

## Stack

- **Client:** React + Vite + React Router
- **Server:** Node + Express
- **Database:** PostgreSQL (via `pg`, with SQL migrations)

## Project layout

```
booking-tool/
├── client/            # React app (Vite)
├── server/            # Express API
│   └── src/
│       ├── config/    # env loading/validation
│       └── db/        # pool, migrations, migration runner, seed
├── .env.example       # copy to server/.env
└── package.json       # npm workspaces + convenience scripts
```

## Getting started

Requires Node 20+ and a PostgreSQL database.

```bash
# 1. Install all workspace dependencies
npm install

# 2. Configure environment
cp .env.example server/.env      # then edit DATABASE_URL etc.

# 3. Create the schema and load sample data
npm run migrate
npm run seed

# 4. Run client + server together
npm run dev
```

- Client: http://localhost:5173
- API: http://localhost:4000 (health check at `/api/health`)

**Demo admin login** (from the seed): `admin@demo.test` / `demo1234`
(configurable via `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`).

## Future work (out of scope for v1)

Online payments, multiple staff/resources, SMS reminders, customer accounts,
multi-tenant support, and multi-timezone handling.
