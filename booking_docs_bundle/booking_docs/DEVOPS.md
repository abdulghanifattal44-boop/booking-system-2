# DevOps (local + production notes)

## Services (docker-compose)
- `db` (PostgreSQL 16)
- `backend` (Node/Express)
- `frontend` (Customer UI via Nginx)
- `admin_frontend` (Admin UI via Nginx)

Ports:
- Customer UI: `8081`
- Admin UI: `8082`
- Backend API: `4000`
- Postgres: `5432`

## Build switches
Both frontends build from the same `booking-frontend` source, but with a different build arg:
- `VITE_APP_TARGET=customer`
- `VITE_APP_TARGET=admin`

This changes the React routes:
- Customer build has **no admin routes/UI** and returns 404 for `/admin/*`.
- Admin build redirects `/` → `/admin` and protects admin pages.

## Key environment variables
Backend (see `booking-backend/.env.docker`):
- `DATABASE_URL` or DB_* vars
- `JWT_SECRET`
- `ADMIN_EMAIL`, `ADMIN_PASSWORD` (seed admin)

Frontend:
- `VITE_API_BASE_URL=/api` (Nginx proxies `/api/*` → backend)

## Production approach
Recommended:
1) Put customer site and admin site on **different hostnames** (or subdomains):
   - `booking.example.com` (customer)
   - `admin.booking.example.com` (admin)
2) Terminate SSL at a reverse proxy (Nginx/Traefik/Caddy).
3) Restrict admin access (WAF / IP allowlist if possible).
4) Use secrets manager for DB passwords + JWT secret.
5) Backup PostgreSQL volume on a schedule.
