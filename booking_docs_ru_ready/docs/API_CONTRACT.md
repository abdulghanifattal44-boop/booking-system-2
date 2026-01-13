# Контракт API (high-level)

> Обновите пути под вашу реальную реализацию.

## Auth
- POST `/api/auth/register`
- POST `/api/auth/login`
- GET  `/api/auth/me`

## Public (без auth)
- GET `/api/public/organizations`
- GET `/api/public/organizations/{orgId}/branches`
- GET `/api/public/branches/{branchId}/resources`
- GET `/api/public/resources/{resourceId}/availability?date=YYYY-MM-DD`

## Customer (auth)
- POST `/api/bookings`
- GET  `/api/bookings/me`
- POST `/api/bookings/{bookingId}/cancel`

## Admin (роль Admin)
- CRUD `/api/admin/organizations`
- CRUD `/api/admin/branches`
- CRUD `/api/admin/resources`
- POST `/api/admin/resources/{resourceId}/generate-slots`
- GET  `/api/admin/bookings`
- POST `/api/admin/bookings/{bookingId}/status`
