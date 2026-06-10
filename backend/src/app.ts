import express from 'express';
import { createRPC } from 'enders-sync';
import cookieParser from "cookie-parser";
import { login, auth, getAccountInfo, logout } from './auth.js';
import { changeSelfPassword } from './Features/teaching_staff/teaching_staff.service.js';
import { studentsXlsxRouter } from "./routes/students_xlsx.js";
import { qrAttendRouter } from "./routes/qr_attend.js";

import { registerAdminCoreHandlers, registerTeacherAttendanceHandlers } from './DI.js';

export const app = express();
app.use(cookieParser());
app.use(express.json());

export const publicRPC = createRPC(app, '/api/public', () => ({
    success: true
}));

publicRPC.add(login);
publicRPC.add(logout);

export const adminRPC = createRPC(app, '/api/admin', auth.admin);
registerAdminCoreHandlers(adminRPC);
adminRPC.add(getAccountInfo);

export const superRPC = createRPC(app, '/api/superadmin', auth.superadmin);
registerAdminCoreHandlers(superRPC);
registerTeacherAttendanceHandlers(superRPC);
superRPC.add(getAccountInfo);
superRPC.add(changeSelfPassword);
superRPC.add(logout);

export const teachersRPC = createRPC(app, '/api/teacher', auth.teacher);
registerAdminCoreHandlers(teachersRPC);
registerTeacherAttendanceHandlers(teachersRPC);
teachersRPC.add(getAccountInfo);
teachersRPC.add(logout);

app.use(studentsXlsxRouter);
app.use(qrAttendRouter);
