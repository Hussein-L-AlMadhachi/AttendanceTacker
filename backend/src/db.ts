import { PG_App } from 'pg-norm';

// tables
import { StudentsTable } from './Features/students/students.sql.js';
import { LoggedinUsers } from './Features/loggedin_users/loggedin_users.sql.js';
import { TeachingStaff } from './Features/teaching_staff/teaching_staff.sql.js';
import { Attended } from './Features/attended/attended.sql.js';




// Initialize your application
export const app = new PG_App({
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'attendance_trackeroo',
    username: process.env.DB_USER || 'dev',
    password: process.env.DB_PASSWORD || 'dev123456'
});



export const loggedin_users = new LoggedinUsers(app);
export const teaching_staff = new TeachingStaff(app);
export const students = new StudentsTable(app);
export const attended = new Attended(app);

app.register(loggedin_users);
app.register(teaching_staff);
app.register(students);
app.register(attended);
