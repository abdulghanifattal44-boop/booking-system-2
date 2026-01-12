-- 📅 إنشاء دوال إدارة الفترات الزمنية
CREATE OR REPLACE FUNCTION booking.get_branch_timezone(p_resource_id uuid)
RETURNS text LANGUAGE sql STABLE AS $$
  SELECT b.timezone
  FROM booking.resources r
  JOIN booking.branches b ON b.id = r.branch_id
  WHERE r.id = p_resource_id;
$$;

CREATE OR REPLACE FUNCTION booking.get_slot_minutes(p_resource_id uuid)
RETURNS int LANGUAGE sql STABLE AS $$
  SELECT rt.slot_duration_min
  FROM booking.resources r
  JOIN booking.resource_types rt ON rt.id = r.type_id
  WHERE r.id = p_resource_id;
$$;

CREATE OR REPLACE FUNCTION booking.is_holiday_for_resource(p_resource_id uuid, p_date date)
RETURNS boolean LANGUAGE sql STABLE AS $$
  SELECT EXISTS (
    SELECT 1
    FROM booking.resources r
    JOIN booking.holidays h ON h.branch_id = r.branch_id
    WHERE r.id = p_resource_id
      AND h.date = p_date
  );
$$;

CREATE OR REPLACE FUNCTION booking.generate_timeslots_for_resource(
  p_resource_id uuid,
  p_start_date  date,
  p_end_date    date
) RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  v_tz           text;
  v_slot_min     int;
  v_date         date;
  v_dow          int;
  v_start_time   time;
  v_end_time     time;
  v_cursor_ts    timestamptz;
  v_next_ts      timestamptz;
  v_inserted     int := 0;
BEGIN
  IF p_end_date <= p_start_date THEN
    RAISE EXCEPTION 'end_date must be greater than start_date';
  END IF;

  SELECT booking.get_branch_timezone(p_resource_id) INTO v_tz;
  SELECT booking.get_slot_minutes(p_resource_id) INTO v_slot_min;

  IF v_tz IS NULL OR v_slot_min IS NULL THEN
    RAISE EXCEPTION 'Resource %, missing timezone or slot_duration_min', p_resource_id;
  END IF;

  v_date := p_start_date;
  WHILE v_date < p_end_date LOOP
    -- skip holidays
    IF NOT booking.is_holiday_for_resource(p_resource_id, v_date) THEN
      v_dow := EXTRACT(ISODOW FROM v_date);  -- 1=Mon .. 7=Sun
      -- schedule_templates uses 0=Sunday..6=Saturday; map ISO (Mon=1..Sun=7)
      v_dow := CASE v_dow WHEN 7 THEN 0 ELSE v_dow END;

      FOR v_start_time, v_end_time IN
        SELECT st.start_time, st.end_time
        FROM booking.schedule_templates st
        WHERE st.resource_id = p_resource_id
          AND st.day_of_week = v_dow
      LOOP
        -- Build window start/end in branch timezone via AT TIME ZONE (DST-safe)
        v_cursor_ts := ( (v_date::timestamp + v_start_time) AT TIME ZONE v_tz );
        v_next_ts   := ( (v_date::timestamp + v_end_time)   AT TIME ZONE v_tz );

        WHILE v_cursor_ts < v_next_ts LOOP
          -- advance by slot duration
          DECLARE
            v_step_end timestamptz := v_cursor_ts + make_interval(mins => v_slot_min);
          BEGIN
            IF v_step_end > v_next_ts THEN
              EXIT; -- do not create partial slot exceeding template
            END IF;

            -- Insert if not exists; rely on unique (resource_id, start_at, end_at)
            INSERT INTO booking.timeslots(resource_id, start_at, end_at, status, available_capacity)
            VALUES (
              p_resource_id, 
              v_cursor_ts, 
              v_step_end, 
              'open',
              (SELECT max_capacity FROM booking.schedule_templates 
               WHERE resource_id = p_resource_id AND day_of_week = v_dow LIMIT 1)
            )
            ON CONFLICT ON CONSTRAINT timeslot_unique_slot DO NOTHING;

            IF FOUND THEN
              v_inserted := v_inserted + 1;
            END IF;

            v_cursor_ts := v_step_end;
          END;
        END LOOP;
      END LOOP;
    END IF;

    v_date := v_date + INTERVAL '1 day';
  END LOOP;

  RETURN v_inserted;
END;
$$;

CREATE OR REPLACE FUNCTION booking.generate_timeslots_for_branch(
  p_branch_id uuid,
  p_start_date date,
  p_end_date   date
) RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  v_res_id uuid;
  v_total  int := 0;
BEGIN
  FOR v_res_id IN
    SELECT id FROM booking.resources WHERE branch_id = p_branch_id AND active = true
  LOOP
    v_total := v_total + booking.generate_timeslots_for_resource(v_res_id, p_start_date, p_end_date);
  END LOOP;
  RETURN v_total;
END;
$$;

CREATE OR REPLACE FUNCTION booking.generate_timeslots_for_all(
  p_start_date date,
  p_end_date   date
) RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  v_branch_id uuid;
  v_total     int := 0;
BEGIN
  FOR v_branch_id IN SELECT id FROM booking.branches LOOP
    v_total := v_total + booking.generate_timeslots_for_branch(v_branch_id, p_start_date, p_end_date);
  END LOOP;
  RETURN v_total;
END;
$$;

CREATE OR REPLACE FUNCTION booking.generate_timeslots_next_7_days()
RETURNS integer LANGUAGE sql AS $$
  SELECT booking.generate_timeslots_for_all(current_date, current_date + 7);
$$;