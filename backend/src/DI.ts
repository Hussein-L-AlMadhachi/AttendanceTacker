// dependency injection for the admin core handlers


import type { RPC } from "enders-sync";
import { teachingStaffLoader } from "./Features/teaching_staff/@loader.js";
import { studentsLoader } from "./Features/students/@loader.js";
import { attendedLoader } from "./Features/attended/@loader.js";

export function registerAdminCoreHandlers(rpc: RPC) {
    teachingStaffLoader(rpc);
    studentsLoader(rpc);
}

export function registerTeacherAttendanceHandlers(rpc: RPC) {
    attendedLoader(rpc);
}
