import { loggedin_users } from "../src/db.js";
import { normalize_arabic } from "../src/helpers/normalize_arabic.js";
import * as fs from 'fs';
import * as path from 'path';



// Load configuration from JSON file
const configPath = path.join(process.cwd(), '../.default_accounts.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));



if (!config.admin.username || !config.admin.password || !config.superadmin.username || !config.superadmin.password) {
    console.error('Error: Invalid configuration file');
    process.exit(1);
}



async function ensureRootAccount(username: string, password: string, role: "admin" | "superadmin") {
    const normalized_username = normalize_arabic(username);
    const existing = await loggedin_users.findByUserName(normalized_username);
    if (existing) {
        console.log(` [SKIP]  ${role.toUpperCase()} user already exists (id:${existing.id})`);
        return existing;
    }

    const [created] = await loggedin_users.insert({
        username,
        normalized_username,
        role,
        password
    });

    return created!;
}

const uid_admin = await ensureRootAccount(
    config.admin.username,
    config.admin.password,
    "admin"
);

const uid2_superadmin = await ensureRootAccount(
    config.superadmin.username,
    config.superadmin.password,
    "superadmin"
);



console.log(` [DONE]  ADMIN user is ready (id:${uid_admin.id})`);
console.log(` [DONE]  SUPERADMIN user is ready (id:${uid2_superadmin.id})`);
