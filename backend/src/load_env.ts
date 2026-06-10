import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";



const moduleDir = path.dirname(fileURLToPath(import.meta.url));

const envCandidates = [
    path.resolve(process.cwd(), ".env"),
    path.resolve(process.cwd(), "..", ".env"),
    path.resolve(moduleDir, "../../.env"),
    path.resolve(moduleDir, "../../../.env"),
    path.resolve(moduleDir, "../../../../.env"),
];

for (const envPath of envCandidates) {
    if (fs.existsSync(envPath)) {
        dotenv.config({ path: envPath });
        break;
    }
}
