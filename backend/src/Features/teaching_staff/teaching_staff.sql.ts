import { PG_Table, type PG_App } from "pg-norm";
import { loggedin_users } from "../../db.js";
import { LOGIN_ATTEMPT_LIMIT } from "../loggedin_users/loggedin_users.sql.js";
import type Postgres from "postgres";

export class TeachingStaff extends PG_Table {

    constructor(app: PG_App) {
        super(app, "teaching_staff", [
            "id", "teacher_name", "teacher_normalized_name",
            "availability_bitmap", "hours_available", "login_credentials", "registered_at"]);
    }

    /** NOTE: availability_bitmap is used for automatic time table generation */

    async create() {
        await this.sql.begin(async sql => {
            await sql`CREATE EXTENSION IF NOT EXISTS pg_trgm`;

            await sql`
                CREATE TABLE IF NOT EXISTS ${sql(this.table_name)} (
                    id                              SERIAL PRIMARY KEY,
                    teacher_name                    VARCHAR(150) NOT NULL,
                    teacher_normalized_name         VARCHAR(150) UNIQUE NOT NULL,

                    login_credentials               INTEGER NOT NULL,

                    availability_bitmap             BIGINT DEFAULT 0,
                    hours_available                 INTEGER DEFAULT 0,

                    registered_at                   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

                    CHECK(hours_available >= 0),
                    FOREIGN KEY (login_credentials) REFERENCES ${sql(loggedin_users.table_name)}(id) ON DELETE CASCADE
                )
            `;

            await sql`
                CREATE INDEX IF NOT EXISTS ${sql(`idx_${this.table_name}_normalized_name`)}
                    ON ${sql(this.table_name)} USING gist (teacher_normalized_name gist_trgm_ops);
            `;

            await sql`
                CREATE INDEX IF NOT EXISTS  ${sql(`idx_${this.table_name}_normalized_name`)}
                    ON ${sql(this.table_name)} (login_credentials);
            `;
        });
    }

    public async autocomplete(searched_name: string) {
        return await this.sql`
            SELECT teacher_name, word_similarity(${searched_name}, teacher_normalized_name) AS similarity
            FROM ${this.sql(this.table_name)}
            WHERE word_similarity(${searched_name}, teacher_normalized_name) > 0.3  AND teacher_normalized_name % ${searched_name}
            ORDER BY similarity DESC LIMIT 10;
        `;
    }

    public async findByName(normalized_name: string) {
        return (await this.sql`
            SELECT ${this.sql(this.visibles)} FROM ${this.sql(this.table_name)} WHERE teacher_normalized_name = ${normalized_name};
        `)[0];
    }

    public async fetchByUserId(user_id: number) {
        return (await this.sql`
            SELECT ${this.sql(this.visibles)} FROM ${this.sql(this.table_name)} WHERE login_credentials = ${user_id};
        `)[0];
    }

    public listAllWithAccountStatus() {
        return this.sql`
            SELECT
                ts.id,
                lu.id AS login_id,
                COALESCE(ts.teacher_name, lu.username) AS teacher_name,
                lu.failed_login_attempts,
                (lu.failed_login_attempts >= ${LOGIN_ATTEMPT_LIMIT}) AS is_locked
            FROM ${this.sql(loggedin_users.table_name)} lu
            LEFT JOIN ${this.sql(this.table_name)} ts
                ON ts.login_credentials = lu.id
            WHERE lu.role = 'teacher'
            ORDER BY teacher_name ASC
        `;
    }
}


