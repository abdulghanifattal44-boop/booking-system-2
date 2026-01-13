# Booking System – Documentation (How it works)

## 1) What you have
This project is a booking system with **two separate frontends** sharing one backend:

- Customer site (public browsing + booking) → `http://localhost:8081`
- Admin site (management dashboard) → `http://localhost:8082/admin/login`
- Backend API → `http://localhost:4000`
- PostgreSQL → `localhost:5432`

Key rule:
- A visitor (Guest) can browse and view availability.
- Creating a booking requires login/registration.
- Admin APIs are protected by JWT + role=admin.

## 2) Project structure
- `docker-compose.yml` → runs db + backend + customer frontend + admin frontend
- `db_dump.sql` → seed sample data

### Backend
- `booking-backend/server.js` → main server (Express + CORS + routes)
- `booking-backend/src/modules/` → feature modules:
  - `auth` → register/login/set-password/me
  - `public` → public org/branch/resource listing
  - `booking` → timeslots + bookings
  - `admin` → CRUD + generate timeslots (protected)

### Frontend
- `booking-frontend/` → same codebase builds into two UIs:
  - `VITE_APP_TARGET=customer` (port 8081)
  - `VITE_APP_TARGET=admin` (port 8082)

## 3) How to run (Docker)
From the project root (same folder as `docker-compose.yml`):

```bash
docker compose up -d --build
```

Open:
- Customer: `http://localhost:8081`
- Admin: `http://localhost:8082/admin/login`
- Backend health: `http://localhost:4000/health`

### Fresh database (important)
Postgres init scripts run **only once** when the `db-data` volume is created.

If you want a clean reset (recommended when schema/seed changed):

```bash
docker compose down -v
# then
docker compose up -d --build
```

## 4) Default logins
Backend bootstrap creates/updates an admin user on startup using env vars in `booking-backend/.env.docker`:

- Admin email: `admin@example.com`
- Admin password: `Admin12345`

Customer users: you create them from the Customer site (Register) or using the Auth API.

## 5) Business flow (how to actually use the system)

### A) Admin setup (this is required before customers can book)
1) Login: `http://localhost:8082/admin/login`
2) Create (or select) an **Organization**.
3) Create **Branches** under the organization.
4) Create **Resource Types** (slot duration rules) if needed.
5) Create **Resources** under a branch (e.g., room, table, doctor).
6) For each resource, create **Schedule Templates** (working hours by day-of-week).
7) Generate **Timeslots** for a date range (this creates bookable slots).

If you skip step 6/7, customers will see "no available timeslots".

### B) Customer booking flow
1) Customer browses org/branch/resource on customer site.
2) Customer views available timeslots.
3) When customer clicks **Book**, the system requires login/register.
4) Booking reduces `timeslots.available_capacity` and creates a record in `bookings`.

5) Customer can search bookings by email (public endpoint):
   - `GET /api/bookings/by-email?email=...`
6) Cancel booking:
   - `POST /api/bookings/:bookingId/cancel`
   - This restores capacity back to the timeslot.

## 6) Authentication model
- Backend uses **JWT**.
- Token is stored in browser localStorage under key `booking_auth`.
- Roles:
  - `admin` → can access `/api/admin/*`
  - `customer` → can create bookings (`POST /api/bookings`)

Admin routes are protected by middleware:
- `requireAuth` (valid JWT)
- `requireAdmin` (role must be admin)

## 7) API endpoints (summary)

### Public (no login)
- `GET /api/public/organizations`
- `GET /api/public/organizations/:orgId/branches`
- `GET /api/public/branches/:branchId/resources`
- `GET /api/resources/:resourceId/timeslots?from=YYYY-MM-DD&to=YYYY-MM-DD`
- `GET /api/bookings/by-email?email=...`

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/set-password` (for legacy users)
- `GET /api/auth/me` (requires JWT)

### Booking
- `POST /api/bookings` (requires JWT)
- `GET /api/bookings/:bookingId`
- `PUT /api/bookings/:bookingId`
- `POST /api/bookings/:bookingId/cancel`

### Admin (requires JWT + admin)
- `GET/POST/PUT/DELETE /api/admin/organizations`
- `GET/POST /api/admin/organizations/:orgId/branches`
- `GET/POST /api/admin/branches/:branchId/resources`
- `POST /api/admin/resources/:resourceId/timeslots/generate`
- `GET /api/admin/bookings` (with filters)

## 8) Common issues
- **Admin shows no branches/resources**: you must create branches/resources first, and you must be logged in as admin (token present). Check the backend logs for 401/403.
- **Status 500**: open browser DevTools → Network, check which endpoint failed. Then check backend container logs:

```bash
docker compose logs -f backend
```

- **CORS blocked**: if you changed ports/domains, update allowedOrigins in `booking-backend/server.js`.

