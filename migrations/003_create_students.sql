CREATE TABLE IF NOT EXISTS students (
    id                      SERIAL PRIMARY KEY,
    student_name            VARCHAR(150) NOT NULL,
    student_normalized_name VARCHAR(150) UNIQUE NOT NULL,
    student_number          INTEGER UNIQUE
);

ALTER TABLE students
    ADD COLUMN IF NOT EXISTS student_number INTEGER;

CREATE INDEX IF NOT EXISTS idx_students_normalized_name
    ON students USING gist (student_normalized_name gist_trgm_ops);

CREATE UNIQUE INDEX IF NOT EXISTS idx_students_student_number
    ON students (student_number)
    WHERE student_number IS NOT NULL;

