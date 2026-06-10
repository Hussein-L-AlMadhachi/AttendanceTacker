import { attended, loggedin_users, students } from "../src/db.js";

console.log('🔄 Applying schema alterations...');
await attended.alter();
await students.alter();
await loggedin_users.alter();
console.log('✅ Schema alterations applied successfully');
