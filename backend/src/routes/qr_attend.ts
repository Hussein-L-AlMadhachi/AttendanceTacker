import { Router } from "express";
import { isValidAttendanceScannerNoRPC } from "../auth.js";
import { attended, students } from "../db.js";

export const QR_ATTEND_CLASS = 1;
export const QR_ATTEND_VERSION = 1;

export const qrAttendRouter = Router();

function parsePositiveInt(value: unknown): number | null {
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed <= 0) {
        return null;
    }
    return parsed;
}

function todayParts() {
    const now = new Date();
    return {
        year: now.getFullYear(),
        month: now.getMonth() + 1,
        day: now.getDate(),
    };
}

qrAttendRouter.get("/api/qr-attend", async (req, res) => {
    try {
        const scanner = isValidAttendanceScannerNoRPC(req, res);
        if (!scanner) {
            return res.status(401).json({
                success: false,
                error: "يجب تسجيل الدخول كعضو المسؤول لتسجيل الحضور",
            });
        }

        const studentClass = parsePositiveInt(req.query.class);
        const version = parsePositiveInt(req.query.version);
        const badgeYear = parsePositiveInt(req.query.year);
        const studentNumber = parsePositiveInt(req.query.id);

        if (studentClass !== QR_ATTEND_CLASS) {
            return res.status(400).json({
                success: false,
                error: "رمز QR غير صالح: المرحلة غير مطابقة",
            });
        }

        if (version !== QR_ATTEND_VERSION) {
            return res.status(400).json({
                success: false,
                error: "رمز QR غير صالح: إصدار غير مدعوم",
            });
        }

        if (badgeYear === null) {
            return res.status(400).json({
                success: false,
                error: "رمز QR غير صالح: السنة مفقودة",
            });
        }

        if (studentNumber === null) {
            return res.status(400).json({
                success: false,
                error: "رمز QR غير صالح: رقم الطالب مفقود",
            });
        }

        const student = await students.findByStudentNumber(studentNumber);
        if (!student) {
            return res.status(404).json({
                success: false,
                error: "الكود الي دخلته غلط",
            });
        }

        const studentId = Number(student.id);
        if (!Number.isInteger(studentId)) {
            return res.status(500).json({
                success: false,
                error: "بيانات الطالب غير صالحة",
            });
        }

        const { year, month, day } = todayParts();
        const created = await attended.markAttendedIfAbsent(studentId, year, month, day);

        return res.json({
            success: true,
            already_attended: !created,
            student_name: student.student_name,
            student_number: student.student_number,
            badge_year: badgeYear,
            date: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            error: "حدث خطأ أثناء تسجيل الحضور",
        });
    }
});
