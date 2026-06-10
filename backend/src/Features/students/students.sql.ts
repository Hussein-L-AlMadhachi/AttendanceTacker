import { PG_Table, type PG_App } from "pg-norm";
import { normalize_arabic } from "../../helpers/normalize_arabic.js";



export class StudentsTable extends PG_Table {


    constructor(app: PG_App) {
        super(app, "students", [
            "id", "student_name", "student_normalized_name", "student_number"
        ]);
    }


    async create() {
        await this.sql.begin(async sql => {

            // Create extension (safe to run in transaction)
            await sql`CREATE EXTENSION IF NOT EXISTS pg_trgm`;

            // Create table
            await sql`
                CREATE TABLE IF NOT EXISTS ${sql(this.table_name)} (
                    id                          SERIAL PRIMARY KEY,

                    student_name                        VARCHAR(150) NOT NULL,
                    student_normalized_name     VARCHAR(150) UNIQUE NOT NULL,
                    student_number              INTEGER UNIQUE
                )
            `;
            await sql`
                CREATE INDEX IF NOT EXISTS ${sql(`idx_${this.table_name}_normalized_name`)}
                    ON ${sql(this.table_name)} USING gist (student_normalized_name gist_trgm_ops);
            `;

        });
    }

    async alter() {
        await this.sql`
            ALTER TABLE ${this.sql(this.table_name)}
            ADD COLUMN IF NOT EXISTS student_number INTEGER
        `;
        await this.sql`
            CREATE UNIQUE INDEX IF NOT EXISTS ${this.sql(`idx_${this.table_name}_student_number`)}
                ON ${this.sql(this.table_name)} (student_number)
                WHERE student_number IS NOT NULL
        `;
    }

    public async autocomplete(searched_name: string) {
        return await this.sql`
            SELECT student_name, word_similarity(${searched_name}, student_normalized_name) AS similarity
            FROM ${this.sql(this.table_name)}
            WHERE word_similarity(${searched_name}, student_normalized_name) > 0.3  AND student_normalized_name % ${searched_name}
            ORDER BY similarity DESC LIMIT 10;
        `;
    }


    public listAll(): Promise<import("postgres").RowList<import("postgres").Row[]>> {
        return this.sql`
            SELECT ${this.sql(this.visibles)} FROM ${this.sql(this.table_name)}
            ORDER BY student_number ASC NULLS LAST, student_name ASC;
        `;
    }


    public async importData(data: Record<string, string>[]) {

        const validatedData = data.map(item => ({
            id: Number(item.id || ''),
            student_name: String(item.student_name || ''),
            student_normalized_name: normalize_arabic(item.student_name!),
            student_number: item.student_number ? Number(item.student_number) : null,
        }));

        // Batch insert for better performance with large datasets
        const batchSize = 100;

        for (let i = 0; i < validatedData.length; i += batchSize) {
            const batch = validatedData.slice(i, i + batchSize);

            await this.sql`
                INSERT INTO students ${this.sql(batch)}
                ON CONFLICT (student_normalized_name) DO UPDATE SET
                    id = EXCLUDED.id,
                    student_name = EXCLUDED.student_name,
                    student_normalized_name = EXCLUDED.student_normalized_name,
                    student_number = EXCLUDED.student_number;
            `;
        }

    }


    public async findByName(student_normalized_name: string) {
        return (await this.sql`
            SELECT ${this.sql(this.visibles)} FROM ${this.sql(this.table_name)} WHERE student_normalized_name = ${student_normalized_name};
        `)[0];
    }


    public async findByStudentNumber(student_number: number) {
        return (await this.sql`
            SELECT ${this.sql(this.visibles)} FROM ${this.sql(this.table_name)} WHERE student_number = ${student_number};
        `)[0];
    }


}


