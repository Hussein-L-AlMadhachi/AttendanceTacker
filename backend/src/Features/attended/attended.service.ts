import { attended, students } from "../../db.js";
import type { Metadata } from "enders-sync";
import type postgres from "postgres";
import { validate_params } from "../../helpers/validate_params.js";
import { toUtcIsoString } from "../../helpers/utc_timestamp.js";



function requireAttendanceRole(metadata: Metadata) {
    const uid = metadata.auth.user_id;
    if (typeof uid !== "number") {
        throw new Error("قم بتسجيل الدخول اولاً");
    }

    const role = metadata.auth.role;
    if (role !== "teacher" && role !== "superadmin" && role !== "admin") {
        throw new Error("غير مصرح بإدارة الحضور");
    }
}

function validateDateParts(year: unknown, month: unknown, day: unknown) {
    if (typeof year !== "number" || typeof month !== "number" || typeof day !== "number") {
        throw new Error("year, month and day must be numbers");
    }

    if (month < 1 || month > 12 || day < 1 || day > 31) {
        throw new Error("invalid date");
    }
}



export async function fetchAttendanceDates(metadata: Metadata): Promise<postgres.RowList<postgres.Row[]>> {
    requireAttendanceRole(metadata);
    return await attended.listDates();
}



export async function fetchAttendedStudents(
    metadata: Metadata,
    year: number,
    month: number,
    day: number
): Promise<postgres.Row[]> {
    requireAttendanceRole(metadata);
    validateDateParts(year, month, day);
    const rows = await attended.findByDate(year, month, day);

    return rows.map((row) => ({
        ...row,
        attended_at: toUtcIsoString(row.attended_at),
    }));
}



export async function markStudentAttended(metadata: Metadata, data: any) {
    requireAttendanceRole(metadata);
    validate_params(data, ["year", "month", "day", "student_id"]);

    const { year, month, day, student_id } = data;
    validateDateParts(year, month, day);

    if (typeof student_id !== "number") {
        throw new Error("student_id must be a valid number");
    }

    const [student_record] = await students.fetch(student_id);
    if (!student_record) {
        throw new Error("Student not found");
    }

    await attended.markAttended(student_id, year, month, day);
}



export async function markGuestAttended(metadata: Metadata, data: any) {
    requireAttendanceRole(metadata);
    validate_params(data, ["year", "month", "day", "guest_name"]);

    const { year, month, day, guest_name } = data;
    validateDateParts(year, month, day);

    const name = String(guest_name).trim();
    if (!name) {
        throw new Error("guest_name is required");
    }

    await attended.markGuestAttended(name, year, month, day);
}



export async function removeAttended(metadata: Metadata, attended_id: number) {
    requireAttendanceRole(metadata);

    if (!attended_id || typeof attended_id !== "number") {
        throw new Error("Attended ID is required");
    }

    await attended.removeAttendance(attended_id);
}
