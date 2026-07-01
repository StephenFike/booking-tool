# Booking Tool — Build Spec

A booking / reservation web app for a small service business. Generic enough to
re-skin for any business (salon, tutor, cleaner, trainer), polished enough to
headline a freelance portfolio. Built to be a convincing "I ship real things"
piece.

**Stack:** JavaScript throughout — React (frontend), Node + Express (API),
PostgreSQL (data). Keep it a monorepo or two clean folders (`/client`,
`/server`). No framework required beyond this; the goal is readable,
hireable-looking code.

---

## 1. What it does (one-liner)

A customer visits a public page, picks a service and an available time slot,
enters their details, and gets a confirmation email. A business owner logs into
an admin area to manage services, availability, and view/cancel bookings.

---

## 2. User roles

- **Customer (public, no login):** browses services, books a slot, receives
  confirmation, can cancel via a link in their email.
- **Owner/admin (login required):** manages services, sets availability,
  views the booking calendar, cancels or marks bookings complete.

---

## 3. Core features (the MVP scope — build these first)

### Public booking flow
- Landing page listing services (name, duration, price, short description).
- Select a service → see a calendar/day view of **available** slots only.
- Slot availability is derived from: owner's working hours − existing bookings −
  service duration. No double-booking allowed (enforce server-side).
- Booking form: name, email, phone, optional note.
- On submit: create booking, send confirmation email, show a success screen
  with booking details + a cancel link.

### Cancellation
- Each booking has a unique token; the cancel link (`/cancel/:token`) lets the
  customer cancel without an account.
- Cancelling frees the slot and emails a cancellation confirmation.

### Admin area (auth-protected)
- Login (email + password).
- **Services CRUD:** create/edit/delete services (name, duration, price, active
  toggle, description).
- **Availability:** set weekly working hours (e.g. Mon–Fri 9–5) and block off
  specific dates/times (holidays, breaks).
- **Bookings view:** calendar or list of upcoming bookings; cancel or mark
  complete; see customer contact info.
- Simple dashboard stat strip: bookings this week, upcoming count, most-booked
  service.

---

## 4. Explicitly out of scope (v1)

Keep these OUT to stay shippable; note them as "future work" in the README:
- Online payments / deposits.
- Multiple staff members / resource assignment.
- SMS reminders.
- Customer accounts / login / booking history.
- Multi-business / multi-tenant.
- Timezone juggling — assume a single business timezone, store UTC, display
  local.

---

## 5. Data model (starting point)

```
users            id, email, password_hash, role, created_at
services         id, name, description, duration_min, price_cents, active, created_at
availability     id, weekday (0-6), start_time, end_time            -- recurring weekly hours
blackouts        id, start_at, end_at, reason                       -- one-off blocked periods
bookings         id, service_id, customer_name, customer_email,
                 customer_phone, note, start_at, end_at, status,
                 cancel_token, created_at
```
- `bookings.status`: `confirmed | cancelled | completed`.
- Enforce no-overlap on `bookings` for `confirmed` rows at the DB/query level,
  not just the UI.

---

## 6. API sketch (REST, JSON)

Public:
- `GET  /api/services` — active services
- `GET  /api/availability?serviceId=&date=` — open slots for a day
- `POST /api/bookings` — create booking
- `GET  /api/bookings/:token` — view booking (for confirm/cancel screens)
- `POST /api/bookings/:token/cancel` — cancel

Admin (auth required):
- `POST /api/auth/login`
- `GET/POST/PUT/DELETE /api/admin/services`
- `GET/POST/PUT/DELETE /api/admin/availability`
- `GET  /api/admin/bookings`
- `POST /api/admin/bookings/:id/cancel`
- `POST /api/admin/bookings/:id/complete`

---

## 7. Slot-availability logic (the tricky part — get this right)

For a given service + date:
1. Pull the recurring working hours for that weekday.
2. Generate candidate slots at the service's duration interval (e.g. 30-min
   service → slots every 30 min within hours). Decide up front: fixed grid vs.
   back-to-back; fixed grid is simpler and fine for v1.
3. Remove any slot that overlaps an existing `confirmed` booking.
4. Remove any slot that overlaps a blackout period.
5. Remove past slots if the date is today.
6. Return the remaining start times.

Do this **on the server**. The client just renders what the API returns.
When creating a booking, re-check availability server-side inside the same
transaction to prevent a race where two people grab the same slot.

---

## 8. Auth (keep it simple but not fake)

- Email + password, hashed with bcrypt.
- Session via httpOnly cookie **or** JWT — either is fine; pick one and be
  consistent.
- One seeded admin user for the demo (document the credentials in the README,
  and make clear it's a demo login).
- Protect all `/api/admin/*` routes with middleware.

---

## 9. Frontend notes

- React with a clean component structure; React Router for pages.
- Pages: `Home/Services`, `Booking (service + slot picker)`, `Confirm`,
  `Cancel`, `Admin Login`, `Admin Dashboard`, `Admin Services`,
  `Admin Availability`, `Admin Bookings`.
- Use a component library or Tailwind so it looks intentional, not default. The
  UI is a big part of why this lands clients — spend effort here.
- Loading and empty states everywhere (no blank flashes).
- Form validation with clear inline errors.
- Mobile-responsive — customers will book on phones.

---

## 10. Email

- Send confirmation + cancellation emails.
- Use a service with a free tier (e.g. Resend, or SMTP via Mailtrap for the
  demo). Abstract it behind a `sendEmail()` function so it's swappable.
- Include booking details and the cancel link in the confirmation.

---

## 11. Quality bar (this is a portfolio piece)

- **Seed script** that loads sample services, availability, and a few bookings
  so the app looks alive on first run.
- **README** with: what it is, screenshots/GIF, live demo link, stack, how to
  run locally, demo admin login, and a "future work" list (the out-of-scope
  items).
- Input validation on both client and server.
- Handle errors gracefully (no raw stack traces to the user).
- `.env.example` with all required env vars documented.
- Reasonable folder structure and named commits — someone reviewing the repo
  should see tidy work.

---

## 12. Deploy (do this — a live link beats everything)

- Frontend + backend deployed and reachable via one URL.
- Managed Postgres (e.g. a free-tier hosted DB).
- Put the live link at the top of the README and in your portfolio.

---

## 13. Suggested build order

1. Project skeleton: `/client` + `/server`, DB connection, `.env.example`.
2. Data model + migrations + seed script.
3. Public API: services list, availability, create booking (with the
   no-double-book logic) — test with a REST client before UI.
4. Public UI: services → slot picker → booking form → confirmation.
5. Cancellation flow (token link).
6. Email integration.
7. Admin auth + protected routes.
8. Admin UI: services, availability, bookings.
9. Polish pass: styling, responsive, loading/empty/error states.
10. Seed data, README, screenshots, deploy.

---

## 14. Case study to write when done

One paragraph for the portfolio: the problem (small businesses lose bookings to
phone tag and double-bookings), your approach (self-serve booking with
server-enforced availability), one screenshot/GIF, the live link, and the
stack. Lead with this, not the repo.
