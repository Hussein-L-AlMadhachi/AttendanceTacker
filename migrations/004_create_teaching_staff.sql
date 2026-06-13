CREATE TABLE IF NOT EXISTS teaching_staff (
    id                      SERIAL PRIMARY KEY,
    teacher_name            VARCHAR(150) NOT NULL,
    teacher_normalized_name VARCHAR(150) UNIQUE NOT NULL,
    login_credentials       INTEGER NOT NULL,
    availability_bitmap     BIGINT DEFAULT 0,
    hours_available         INTEGER DEFAULT 0,
    registered_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT teaching_staff_hours_available_check
        CHECK (hours_available >= 0),
    CONSTRAINT teaching_staff_login_credentials_fkey
        FOREIGN KEY (login_credentials)
        REFERENCES loggedin_users(id)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_teaching_staff_normalized_name
    ON teaching_staff USING gist (teacher_normalized_name gist_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_teaching_staff_login_credentials
    ON teaching_staff (login_credentials);

