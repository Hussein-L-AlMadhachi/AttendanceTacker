import bcrypt from "bcrypt";
import { PG_AuthTable, type PG_App } from "pg-norm";



export const LOGIN_ATTEMPT_LIMIT = 6;

const LOCKOUT_EXEMPT_ROLES = new Set(["admin", "superadmin"]);

// Matches PG_AuthTable timing-attack mitigation hash.
const DUMMY_PASSWORD_HASH = "$2a$12$4jMZgsZF8HpkBKETdDSKDOIuFwkwYTppUbap/RbTyRCpFuHa2UoCe";

type LoginAttemptResult =
    | { status: "ok"; user: { id: number; role: string } }
    | { status: "invalid" }
    | { status: "locked" };



export class LoggedinUsers extends PG_AuthTable {

    constructor(app: PG_App) {
        super(
            app, "loggedin_users",
            [
                "id", "username", "normalized_username",
                "role"
            ]
            , "normalized_username"
        );
    }

    async create() {
        await this.sql`
            CREATE TABLE IF NOT EXISTS ${this.sql(this.table_name)} (
                id                     SERIAL PRIMARY KEY,
                username               VARCHAR(100) NOT NULL,
                normalized_username     VARCHAR(150) UNIQUE NOT NULL,
                ${this.sql(this.passwordField)}  VARCHAR(100) NOT NULL,
                role                   VARCHAR(20) NOT NULL,
                failed_login_attempts  INTEGER NOT NULL DEFAULT 0
            );
        `;
    }

    async alter() {
        await this.sql`
            ALTER TABLE ${this.sql(this.table_name)}
            ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER NOT NULL DEFAULT 0
        `;
    }

    isLoginLockoutExempt(role: string) {
        return LOCKOUT_EXEMPT_ROLES.has(role);
    }

    async resetFailedLoginAttempts(userId: number) {
        await this.sql`
            UPDATE ${this.sql(this.table_name)}
            SET failed_login_attempts = 0
            WHERE id = ${userId}
        `;
    }

    async loginWithLockout(
        normalized_username: string,
        plainTextPassword: string
    ): Promise<LoginAttemptResult> {
        const [user] = await this.sql`
            SELECT
                id,
                role,
                failed_login_attempts,
                ${this.sql(this.passwordField)}
            FROM ${this.sql(this.table_name)}
            WHERE normalized_username = ${normalized_username}
        `;

        if (!user || !user[this.passwordField]) {
            await bcrypt.compare("dummy_password", DUMMY_PASSWORD_HASH);
            return { status: "invalid" };
        }

        const exempt = this.isLoginLockoutExempt(user.role);

        if (!exempt && user.failed_login_attempts >= LOGIN_ATTEMPT_LIMIT) {
            return { status: "locked" };
        }

        const valid = await bcrypt.compare(plainTextPassword, user[this.passwordField]);

        if (valid) {
            if (!exempt && user.failed_login_attempts > 0) {
                await this.resetFailedLoginAttempts(user.id);
            }

            return {
                status: "ok",
                user: {
                    id: user.id,
                    role: user.role
                }
            };
        }

        if (!exempt) {
            const newCount = user.failed_login_attempts + 1;
            await this.sql`
                UPDATE ${this.sql(this.table_name)}
                SET failed_login_attempts = ${newCount}
                WHERE id = ${user.id}
            `;

            if (newCount >= LOGIN_ATTEMPT_LIMIT) {
                return { status: "locked" };
            }
        }

        return { status: "invalid" };
    }

    async updatePassword(userId: number, newPassword: string) {
        const result = await super.updatePassword(userId, newPassword);
        await this.resetFailedLoginAttempts(userId);
        return result;
    }

    async findByUserName(normalized_username: string) {
        return (await this.sql`
            SELECT
                ${this.sql(this.visibles)}
            FROM ${this.sql(this.table_name)}
            WHERE normalized_username = ${normalized_username};
        `)[0];
    }
}
