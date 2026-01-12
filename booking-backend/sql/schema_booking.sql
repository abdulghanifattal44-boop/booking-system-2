------------------------------------------------------------
-- 0) تحضير الداتا بيس و الـ schema
------------------------------------------------------------

-- لو حاب تمسح كل حاجة قديمة (خلي بالك! هيمسح كل البيانات القديمة)
DROP SCHEMA IF EXISTS booking CASCADE;

-- إنشاء الـ schema
CREATE SCHEMA booking;

-- تفعيل pgcrypto لاستخدام gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

SET search_path TO booking, public;

------------------------------------------------------------
-- 1) ENUM TYPES
------------------------------------------------------------

-- حالة الحجز
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'no_show');

-- حالة الـ timeslot
CREATE TYPE timeslot_status AS ENUM ('open', 'blocked', 'maintenance');

-- حالة المستخدم
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended');

------------------------------------------------------------
-- 2) جداول أساسية: Organizations / Branches
------------------------------------------------------------

CREATE TABLE organizations (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name          TEXT NOT NULL,
    contact_email TEXT,
    phone         TEXT,
    address       JSONB NOT NULL DEFAULT '{}'::jsonb,
    settings      JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE branches (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id       UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name         TEXT NOT NULL,
    timezone     TEXT,
    contact_info JSONB NOT NULL DEFAULT '{}'::jsonb,
    address      JSONB NOT NULL DEFAULT '{}'::jsonb,
    settings     JSONB NOT NULL DEFAULT '{}'::jsonb,
    active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_branches_org_id ON branches(org_id);

------------------------------------------------------------
-- 3) Resource Types & Resources
------------------------------------------------------------

CREATE TABLE resource_types (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name              TEXT NOT NULL,
    description       TEXT,
    slot_duration_min INTEGER NOT NULL DEFAULT 60,   -- مدة السلوْت بالدقيقة
    max_booking_days  INTEGER NOT NULL DEFAULT 30,   -- أقصى عدد أيام قدّام
    min_booking_hours INTEGER NOT NULL DEFAULT 1,    -- أقل وقت قبل الحجز بالساعات
    settings          JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX ux_resource_types_name ON resource_types(name);

CREATE TABLE resources (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id   UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    type_id     UUID NOT NULL REFERENCES resource_types(id) ON DELETE RESTRICT,
    name        TEXT NOT NULL,
    description TEXT,
    capacity    INTEGER NOT NULL DEFAULT 1,
    features    JSONB NOT NULL DEFAULT '[]'::jsonb,      -- ["projector","wifi",...]
    settings    JSONB NOT NULL DEFAULT '{}'::jsonb,
    active      BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_resources_branch_id ON resources(branch_id);
CREATE INDEX idx_resources_type_id   ON resources(type_id);

------------------------------------------------------------
-- 4) Schedule Templates & Timeslots
------------------------------------------------------------

CREATE TABLE schedule_templates (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource_id  UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
    day_of_week  SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday
    start_time   TIME NOT NULL,
    end_time     TIME NOT NULL,
    max_capacity INTEGER, -- لو NULL نستخدم capacity من resource
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_schedule_templates_res_dow
    ON schedule_templates(resource_id, day_of_week);

CREATE TABLE timeslots (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource_id        UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
    start_at           TIMESTAMPTZ NOT NULL,
    end_at             TIMESTAMPTZ NOT NULL,
    status             timeslot_status NOT NULL DEFAULT 'open',
    available_capacity INTEGER NOT NULL,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_timeslots_unique UNIQUE (resource_id, start_at, end_at)
);

CREATE INDEX idx_timeslots_resource_id ON timeslots(resource_id);
CREATE INDEX idx_timeslots_status      ON timeslots(status);

------------------------------------------------------------
-- 5) Roles / Users / Policies / Bookings
------------------------------------------------------------

CREATE TABLE roles (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL UNIQUE,
    description TEXT
);

CREATE TABLE users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL,
    email       TEXT NOT NULL UNIQUE,
    phone       TEXT,
  password_hash TEXT,
  role_id     UUID REFERENCES roles(id) ON DELETE SET NULL,
    org_id      UUID REFERENCES organizations(id) ON DELETE SET NULL,
    status      user_status NOT NULL DEFAULT 'active',
    preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
    last_login  TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_org_id  ON users(org_id);
CREATE INDEX idx_users_role_id ON users(role_id);

-- سياسة الحجز (بسيطة الآن عشان الـ FK في bookings ما يكسرش)
CREATE TABLE booking_policies (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL,
    description TEXT,
    settings    JSONB NOT NULL DEFAULT '{}'::jsonb,
    active      BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE bookings (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    resource_id      UUID NOT NULL REFERENCES resources(id) ON DELETE RESTRICT,
    timeslot_id      UUID NOT NULL REFERENCES timeslots(id) ON DELETE RESTRICT,
    policy_id        UUID REFERENCES booking_policies(id) ON DELETE SET NULL,
    status           booking_status NOT NULL DEFAULT 'pending',
    guest_count      INTEGER NOT NULL DEFAULT 1,
    special_requests TEXT,
    metadata         JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_bookings_user_id     ON bookings(user_id);
CREATE INDEX idx_bookings_resource_id ON bookings(resource_id);
CREATE INDEX idx_bookings_timeslot_id ON bookings(timeslot_id);
CREATE INDEX idx_bookings_status      ON bookings(status);

------------------------------------------------------------
-- 6) دالة generic لتحديث updated_at + التريجرات
------------------------------------------------------------

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- نربط التريجر على كل جدول فيه updated_at

CREATE TRIGGER trg_organizations_updated_at
BEFORE UPDATE ON organizations
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_branches_updated_at
BEFORE UPDATE ON branches
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_resource_types_updated_at
BEFORE UPDATE ON resource_types
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_resources_updated_at
BEFORE UPDATE ON resources
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_schedule_templates_updated_at
BEFORE UPDATE ON schedule_templates
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_timeslots_updated_at
BEFORE UPDATE ON timeslots
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_booking_policies_updated_at
BEFORE UPDATE ON booking_policies
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_bookings_updated_at
BEFORE UPDATE ON bookings
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

------------------------------------------------------------
-- 7) دالة توليد الـ Timeslots: generate_timeslots_for_resource
------------------------------------------------------------

CREATE OR REPLACE FUNCTION generate_timeslots_for_resource(
    p_resource_id UUID,
    p_start_date  DATE,
    p_end_date    DATE
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_slot_duration   INTEGER;
    v_date            DATE;
    v_dow             INTEGER;
    v_start_time      TIME;
    v_end_time        TIME;
    v_max_capacity    INTEGER;
    v_current_start   TIMESTAMPTZ;
    v_current_end     TIMESTAMPTZ;
    v_created_count   INTEGER := 0;
BEGIN
    IF p_end_date <= p_start_date THEN
        RAISE EXCEPTION 'end_date must be greater than start_date';
    END IF;

    -- نجيب مدة السلوْت من نوع المورد
    SELECT rt.slot_duration_min
    INTO v_slot_duration
    FROM resources r
    JOIN resource_types rt ON rt.id = r.type_id
    WHERE r.id = p_resource_id;

    IF v_slot_duration IS NULL OR v_slot_duration <= 0 THEN
        RAISE EXCEPTION 'Invalid slot_duration_min for resource %', p_resource_id;
    END IF;

    v_date := p_start_date;

    WHILE v_date <= p_end_date LOOP
        v_dow := EXTRACT(DOW FROM v_date);

        FOR v_start_time, v_end_time, v_max_capacity IN
            SELECT st.start_time, st.end_time, st.max_capacity
            FROM schedule_templates st
            WHERE st.resource_id = p_resource_id
              AND st.day_of_week = v_dow
        LOOP
            v_current_start := (v_date::timestamptz + v_start_time);
            WHILE v_current_start < (v_date::timestamptz + v_end_time) LOOP
                v_current_end := v_current_start + (v_slot_duration || ' minutes')::interval;

                -- capacity: لو max_capacity موجود نستخدمه، وإلا capacity من resource
                SELECT COALESCE(v_max_capacity, r.capacity)
                INTO v_max_capacity
                FROM resources r
                WHERE r.id = p_resource_id;

                -- إدخال الـ timeslot لو مش موجود
                BEGIN
                    INSERT INTO timeslots (
                        resource_id, start_at, end_at, status, available_capacity
                    )
                    VALUES (
                        p_resource_id,
                        v_current_start,
                        v_current_end,
                        'open',
                        v_max_capacity
                    )
                    ON CONFLICT (resource_id, start_at, end_at) DO NOTHING;

                    IF FOUND THEN
                        v_created_count := v_created_count + 1;
                    END IF;
                EXCEPTION
                    WHEN OTHERS THEN
                        -- لو حصل خطأ في سطر واحد نكمل الباقي
                        RAISE NOTICE 'Failed to insert timeslot: %, %', SQLERRM, SQLSTATE;
                END;

                v_current_start := v_current_end;
            END LOOP;
        END LOOP;

        v_date := v_date + INTERVAL '1 day';
    END LOOP;

    RETURN v_created_count;
END;
$$;

------------------------------------------------------------
-- 8) DATA SEED بسيط (Org + Branches + Resource Types + Resources + User تجريبي)
------------------------------------------------------------

-- منظمة أمريكية للاختبارات
INSERT INTO organizations (id, name, contact_email, phone, address, settings)
VALUES (
    '11111111-1111-1111-1111-111111111111',
    'US Test Organization',
    'admin@ustest.org',
    '+1-555-000-0000',
    '{"country":"US","city":"New York"}'::jsonb,
    '{"language":"en","timezone":"America/New_York"}'::jsonb
);

-- فروع
INSERT INTO branches (id, org_id, name, timezone, contact_info, address, settings)
VALUES
(
    '22222222-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111111',
    'NYC Business Center',
    'America/New_York',
    '{"email":"nyc@ustest.org","phone":"+1-555-111-1111"}'::jsonb,
    '{"city":"New York","address_line":"5th Avenue"}'::jsonb,
    '{"allow_walkins":true}'::jsonb
),
(
    '33333333-3333-3333-3333-333333333333',
    '11111111-1111-1111-1111-111111111111',
    'LA Restaurant',
    'America/Los_Angeles',
    '{"email":"la@ustest.org","phone":"+1-555-222-2222"}'::jsonb,
    '{"city":"Los Angeles","address_line":"Sunset Blvd"}'::jsonb,
    '{"allow_walkins":true}'::jsonb
),
(
    '44444444-4444-4444-4444-444444444444',
    '11111111-1111-1111-1111-111111111111',
    'SF Clinic',
    'America/Los_Angeles',
    '{"email":"sf@ustest.org","phone":"+1-555-333-3333"}'::jsonb,
    '{"city":"San Francisco","address_line":"Market Street"}'::jsonb,
    '{"allow_walkins":false}'::jsonb
);

-- Resource Types
INSERT INTO resource_types (id, name, description, slot_duration_min, max_booking_days, min_booking_hours, settings)
VALUES
(
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
    'Meeting Room',
    'Business center meeting room',
    30,
    30,
    1,
    '{"category":"business"}'::jsonb
),
(
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2',
    'Restaurant Table',
    'Restaurant table booking',
    60,
    14,
    1,
    '{"category":"restaurant"}'::jsonb
),
(
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3',
    'Doctor Appointment',
    'Medical clinic appointment slot',
    30,
    7,
    2,
    '{"category":"clinic"}'::jsonb
);

-- Resources
INSERT INTO resources (id, branch_id, type_id, name, description, capacity, features, settings, active)
VALUES
(
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
    '22222222-2222-2222-2222-222222222222',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
    'Hudson Conference Room',
    'Large meeting room with city view',
    10,
    '["projector","whiteboard","video_call"]'::jsonb,
    '{"floor":15,"room_code":"HZ-15A"}'::jsonb,
    TRUE
),
(
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2',
    '33333333-3333-3333-3333-333333333333',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2',
    'Main Dining Table 1',
    'Corner table with window view',
    4,
    '["window_view"]'::jsonb,
    '{"section":"A"}'::jsonb,
    TRUE
),
(
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3',
    '44444444-4444-4444-4444-444444444444',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3',
    'Dr. Smith Office',
    'General practitioner office',
    1,
    '["wheelchair_access"]'::jsonb,
    '{"room":"101"}'::jsonb,
    TRUE
);

-- Role + User خاص للاختبار
INSERT INTO roles (id, name, description)
VALUES (
    '55555555-5555-5555-5555-555555555555',
    'customer',
    'End customer booking through public API'
);

INSERT INTO users (id, name, email, phone, role_id, org_id, status, preferences)
VALUES (
    '66666666-6666-6666-6666-666666666666',
    'Mohamed Example',
    'mohamed@example.com',
    '+1-555-444-4444',
    '55555555-5555-5555-5555-555555555555',
    '11111111-1111-1111-1111-111111111111',
    'active',
    '{}'::jsonb
);

------------------------------------------------------------
-- END
------------------------------------------------------------

-- Seed base roles
INSERT INTO booking.roles (name, description) VALUES
  ('admin','System administrator'),
  ('customer','Customer user')
ON CONFLICT (name) DO NOTHING;
