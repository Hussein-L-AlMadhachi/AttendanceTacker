import { PG_Table, type PG_App } from "pg-norm";



export class Attended extends PG_Table {

    constructor(app: PG_App) {
        super(app, "attended", [
            "id", "year", "month", "day", "student", "guest_name", "attended_at"
        ]);
    }

    async create() {
        await this.sql`
            CREATE TABLE IF NOT EXISTS attended (
                id              SERIAL PRIMARY KEY,
                year            INTEGER NOT NULL,
                month           INTEGER NOT NULL,
                day             INTEGER NOT NULL,
                student         INTEGER,
                guest_name      VARCHAR(150),
                attended_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

                FOREIGN KEY (student) REFERENCES students(id) ON DELETE CASCADE,
                CHECK (
                    (student IS NOT NULL AND guest_name IS NULL)
                    OR (student IS NULL AND guest_name IS NOT NULL)
                )
            );
        `;
        await this.sql`
            CREATE UNIQUE INDEX IF NOT EXISTS idx_attended_student_day
                ON attended (year, month, day, student)
                WHERE student IS NOT NULL
        `;
        await this.sql`
            CREATE UNIQUE INDEX IF NOT EXISTS idx_attended_guest_day
                ON attended (year, month, day, guest_name)
                WHERE student IS NULL
        `;
    }

    async alter() {
        await this.sql`DROP TABLE IF EXISTS absented`;
        await this.sql`DROP TABLE IF EXISTS attendance_record`;

        await this.sql`
            CREATE TABLE IF NOT EXISTS attended (
                id              SERIAL PRIMARY KEY,
                year            INTEGER NOT NULL,
                month           INTEGER NOT NULL,
                day             INTEGER NOT NULL,
                student         INTEGER,
                guest_name      VARCHAR(150),
                attended_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

                FOREIGN KEY (student) REFERENCES students(id) ON DELETE CASCADE
            );
        `;

        await this.sql`
            DO $$ BEGIN
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
            END $$
        `;

        await this.sql`
            ALTER TABLE attended
            ALTER COLUMN student DROP NOT NULL
        `;
        await this.sql`
            ALTER TABLE attended
            ADD COLUMN IF NOT EXISTS guest_name VARCHAR(150)
        `;
        await this.sql`
            ALTER TABLE attended
            DROP CONSTRAINT IF EXISTS attended_year_month_day_student_key
        `;
        await this.sql`
            DO $$ BEGIN
                ALTER TABLE attended
                ADD CONSTRAINT attended_person_check
                CHECK (
                    (student IS NOT NULL AND guest_name IS NULL)
                    OR (student IS NULL AND guest_name IS NOT NULL)
                );
            EXCEPTION WHEN duplicate_object THEN NULL;
            END $$
        `;
        await this.sql`
            CREATE UNIQUE INDEX IF NOT EXISTS idx_attended_student_day
                ON attended (year, month, day, student)
                WHERE student IS NOT NULL
        `;
        await this.sql`
            CREATE UNIQUE INDEX IF NOT EXISTS idx_attended_guest_day
                ON attended (year, month, day, guest_name)
                WHERE student IS NULL
        `;
    }

    async listDates() {
        return await this.sql`
            SELECT
                year,
                month,
                day,
                COUNT(*)::int AS student_count
            FROM attended
            GROUP BY year, month, day
            ORDER BY year DESC, month DESC, day DESC
        `;
    }

    async findByDate(year: number, month: number, day: number) {
        return await this.sql`
            SELECT
                att.id AS id,
                att.year AS year,
                att.month AS month,
                att.day AS day,
                att.student AS student_id,
                COALESCE(stu.student_name, att.guest_name) AS student_name,
                (att.student IS NULL) AS is_guest,
                att.attended_at AS attended_at
            FROM attended att
            LEFT JOIN students stu ON stu.id = att.student
            WHERE att.year = ${year}
              AND att.month = ${month}
              AND att.day = ${day}
            ORDER BY is_guest ASC, student_name ASC
        `;
    }

    async markAttended(student_id: number, year: number, month: number, day: number) {
        await this.sql`
            INSERT INTO attended (student, year, month, day)
            VALUES (${student_id}, ${year}, ${month}, ${day})
            ON CONFLICT DO NOTHING
        `;
    }

    async markGuestAttended(guest_name: string, year: number, month: number, day: number) {
        await this.sql`
            INSERT INTO attended (guest_name, year, month, day)
            VALUES (${guest_name}, ${year}, ${month}, ${day})
            ON CONFLICT DO NOTHING
        `;
    }

    async isStudentAttendedOnDate(student_id: number, year: number, month: number, day: number) {
        const rows = await this.sql`
            SELECT id FROM attended
            WHERE year = ${year}
              AND month = ${month}
              AND day = ${day}
              AND student = ${student_id}
            LIMIT 1
        `;
        return rows.length > 0;
    }

    async isGuestAttendedOnDate(guest_name: string, year: number, month: number, day: number) {
        const rows = await this.sql`
            SELECT id FROM attended
            WHERE year = ${year}
              AND month = ${month}
              AND day = ${day}
              AND student IS NULL
              AND guest_name = ${guest_name}
            LIMIT 1
        `;
        return rows.length > 0;
    }

    async markAttendedIfAbsent(student_id: number, year: number, month: number, day: number) {
        if (await this.isStudentAttendedOnDate(student_id, year, month, day)) {
            return false;
        }

        await this.markAttended(student_id, year, month, day);
        return true;
    }

    async markGuestAttendedIfAbsent(guest_name: string, year: number, month: number, day: number) {
        if (await this.isGuestAttendedOnDate(guest_name, year, month, day)) {
            return false;
        }

        await this.markGuestAttended(guest_name, year, month, day);
        return true;
    }

    async removeAttendance(attended_id: number) {
        await this.sql`
            DELETE FROM attended
            WHERE id = ${attended_id};
        `;
    }

}
