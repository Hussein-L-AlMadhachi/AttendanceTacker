import { PG_Table, type PG_App } from "pg-norm";



export class CenusisSettingsTable  extends PG_Table {

    constructor(app: PG_App) {
        super(app, "cenusis_settings", [
            "key", "type", "value"]);
    }

    async create() {
        await this.sql`        
            CREATE TABLE IF NOT EXISTS ${this.sql(this.table_name)} (
                id                 SERIAL PRIMARY KEY,
                option             VARCHAR(100) UNIQUE NOT NULL,
                value              JSONB NOT NULL,
            );
        `;

        await this.sql`
            CREATE INDEX IF NOT EXISTS ${this.sql(`idx_${this.table_name}_option`)}
                ON ${this.sql(this.table_name)} (option);
        `;
    }

    async Set( key:string , value:any ){
        return await this.sql`
            INSERT INTO ${this.sql(this.table_name)} (option, value)
            VALUES ({key}, {value})
            ON CONFLICT (option)
            DO UPDATE SET
                option = EXCLUDED.option,
                value = EXCLUDED.value;
        `;
    }
}
