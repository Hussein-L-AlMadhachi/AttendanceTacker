import { app } from "../src/db.js";

console.log('🔄 Creating tables...');
await app.createTables();
console.log('✅ Tables created successfully');
