# Keys & Constraints (schema: booking)

This is extracted from `booking-backend/sql/schema_booking.sql`.

## organizations
- PK: `id`

## branches
- PK: `id`
- FK: `org_id` → `organizations.id` (ON DELETE CASCADE)

## resource_types
- PK: `id`
- UNIQUE: `name`

## resources
- PK: `id`
- FK: `branch_id` → `branches.id` (ON DELETE CASCADE)
- FK: `type_id` → `resource_types.id` (ON DELETE SET NULL)

## schedule_templates
- PK: `id`
- FK: `resource_id` → `resources.id` (ON DELETE CASCADE)
- Index: `(resource_id, day_of_week)`

## timeslots
- PK: `id`
- FK: `resource_id` → `resources.id` (ON DELETE CASCADE)
- UNIQUE: `(resource_id, start_at, end_at)`
- Index: `(resource_id, start_at)`

## roles
- PK: `id`
- UNIQUE: `name`

## users
- PK: `id`
- UNIQUE: `email`
- FK: `role_id` → `roles.id` (ON DELETE SET NULL)
- FK: `org_id` → `organizations.id` (ON DELETE SET NULL)
- Index: `(org_id, role_id)`

## booking_policies
- PK: `id`

## bookings
- PK: `id`
- FK: `user_id` → `users.id` (ON DELETE SET NULL)
- FK: `resource_id` → `resources.id` (ON DELETE SET NULL)
- FK: `timeslot_id` → `timeslots.id` (ON DELETE SET NULL)
- FK: `policy_id` → `booking_policies.id` (ON DELETE SET NULL)
- Index: `(resource_id, status, created_at)`
- Index: `(user_id, created_at)`

