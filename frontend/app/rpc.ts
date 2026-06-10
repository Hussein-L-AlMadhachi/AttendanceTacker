import { RPC } from "enders-sync-client";



interface Loggedin {
    user_id: number;
    role: string;
}

export interface AccountInfo {
    id: number;
    username: string;
    role: string;
}

export interface teacherData {
    id?: number;
    login_id?: number;
    teacher_name: string;
    password?: string;
    failed_login_attempts?: number;
    is_locked?: boolean;
}

export interface TeacherUpdateData {
    name?: string;
    password?: string;
}

export interface studentData {
    id?: number;
    student_name: string;
    student_number?: number | null;
}

export interface StudentUpdateData {
    student_name?: string;
    student_number?: number | null;
}

export interface AttendanceDateData {
    id?: number;
    year: number;
    month: number;
    day: number;
    student_count: number;
}

export interface AttendedStudentData {
    id: number;
    year: number;
    month: number;
    day: number;
    student_id: number | null;
    student_name: string;
    is_guest: boolean;
    attended_at: string;
}

interface PublicRPC {
    load(): Promise<void>;
    login(username: string, password: string): Promise<Loggedin>;
    logout(): Promise<void>;
}

// handlers shared by admin, superadmin and teacher endpoints
interface AdminCoreRPC {
    load(): Promise<void>;
    getAccountInfo(): Promise<AccountInfo>;

    // teachers accounts management
    fetchTeachers(): Promise<teacherData[]>;
    registerTeacher(data: teacherData): Promise<number>;
    updateUser(id: number, data: TeacherUpdateData): Promise<number>;
    activateLockedUser(teacher_id: number): Promise<number>;
    unlockLoginAccount(login_id: number): Promise<number>;
    deleteUser(id: number): Promise<void>;
    changeTeacherPassword(id: number, password: string): Promise<number>;
    autocompleteTeacher(name: string): Promise<string[]>;
    getProfile(): Promise<teacherData>;

    // students registration management
    fetchStudents(): Promise<studentData[]>;
    newStudent(data: studentData): Promise<number>;
    updateStudent(id: number, data: StudentUpdateData): Promise<number>;
    deleteStudent(id: number): Promise<void>;
    fetchStudentInfo(id: number): Promise<studentData>;
    autocompleteStudent(name: string): Promise<string[]>;
    findStudentByName(name: string): Promise<studentData>;
}

// handlers shared by superadmin and teacher endpoints
interface AttendanceRPC {
    fetchAttendanceDates(): Promise<AttendanceDateData[]>;
    fetchAttendedStudents(year: number, month: number, day: number): Promise<AttendedStudentData[]>;
    markStudentAttended(data: { year: number, month: number, day: number, student_id: number }): Promise<void>;
    markGuestAttended(data: { year: number, month: number, day: number, guest_name: string }): Promise<void>;
    removeAttended(attended_id: number): Promise<void>;
}

type AdminsRPC = AdminCoreRPC;

interface TeachersRPC extends AdminCoreRPC, AttendanceRPC {
    logout(): Promise<void>;
}

interface SuperAdminRPC extends AdminCoreRPC, AttendanceRPC {
    changeSelfPassword(password: string): Promise<number>;
    logout(): Promise<void>;
}


export const publicRPC = new RPC('/api/public') as unknown as PublicRPC;
export const adminRPC = new RPC('/api/admin') as unknown as AdminsRPC;
export const superAdminRPC = new RPC('/api/superadmin') as unknown as SuperAdminRPC;
export const teacherRPC = new RPC('/api/teacher') as unknown as TeachersRPC;

export async function initializeRPC() {
    await publicRPC.load();
    await adminRPC.load();
    await superAdminRPC.load();
    await teacherRPC.load();
}

await initializeRPC()
