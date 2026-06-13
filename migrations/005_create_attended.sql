DROP TABLE IF EXISTS absented;
DROP TABLE IF EXISTS attendance_record;

CREATE TABLE IF NOT EXISTS attended (
    id          SERIAL PRIMARY KEY,
    year        INTEGER NOT NULL,
    month       INTEGER NOT NULL,
    day         INTEGER NOT NULL,
    student     INTEGER,
    guest_name  VARCHAR(150),
    attended_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT attended_student_fkey
        FOREIGN KEY (student)
        REFERENCES students(id)
        ON DELETE CASCADE
);

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'attended'
          AND column_name = 'attended_at'
          AND data_type = 'timestamp without time zone'
    ) THEN
        ALTER TABLE attended
            ALTER COLUMN attended_at TYPE TIMESTAMPTZ
            USING attended_at AT TIME ZONE 'UTC';
    END IF;
END $$;

ALTER TABLE attended
    ALTER COLUMN student DROP NOT NULL;

ALTER TABLE attended
    ADD COLUMN IF NOT EXISTS guest_name VARCHAR(150);

ALTER TABLE attended
    DROP CONSTRAINT IF EXISTS attended_year_month_day_student_key;

DO $$
BEGIN
    ALTER TABLE attended
        ADD CONSTRAINT attended_person_check
        CHECK (
            (student IS NOT NULL AND guest_name IS NULL)
            OR (student IS NULL AND guest_name IS NOT NULL)
        );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_attended_student_day
    ON attended (year, month, day, student)
    WHERE student IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_attended_guest_day
    ON attended (year, month, day, guest_name)
    WHERE student IS NULL;

