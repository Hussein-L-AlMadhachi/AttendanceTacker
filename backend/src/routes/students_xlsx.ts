import multer, { memoryStorage } from 'multer';
import { Router } from 'express';



import { decodeXlsx } from '../helpers/xlsx_codec.js';
import { translateHeaders } from "../helpers/headers_translate.js"



// services
import { isValidAdminNoRPC, isValidSuperadminNoRPC } from '../auth.js';
import { normalize_arabic } from '../helpers/normalize_arabic.js';
import { app } from '../db.js';




export const upload = multer({ storage: memoryStorage() });

export const studentsXlsxRouter = Router();

const STUDENT_IMPORT_HEADERS = ["الاسم", "رقم الطالب", "الطالب"];

const STUDENT_HEADER_TRANSLATIONS = {
    "الاسم": "student_name",
    "الطالب": "student_name",
    "رقم الطالب": "student_number",
} as const;

function parseStudentNumber(value: unknown): number | null {
    if (value === null || value === undefined || value === "") {
        return null;
    }

    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
        return null;
    }

    return Math.trunc(parsed);
}

studentsXlsxRouter.post('/api/students/import', upload.single('file'), async (req, res) => {

    try {
        const admin_auth = isValidAdminNoRPC(req, res);
        const superadmin_auth = isValidSuperadminNoRPC(req, res);

        if (!admin_auth && !superadmin_auth) {
            res.status(401).json({
                success: false,
                error: "unauthorized"
            })
            return;
        };

        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: "No file uploaded"
            });
        }

        const buffer: any = req.file.buffer;

        const { data: students_js_obj, missingHeaders, fileHeaders } = await decodeXlsx(
            buffer,
            [...STUDENT_IMPORT_HEADERS]
        );

        if (missingHeaders.length === STUDENT_IMPORT_HEADERS.length) {
            return res.status(400).json({
                success: false,
                error: `الملف لا يحتوي على أي من الحقول المطلوبة.\n`
                    + `الحقول المطلوبة: (${STUDENT_IMPORT_HEADERS.join('، ')})\n`
                    + `الحقول الموجودة في الملف: (${fileHeaders.length > 0 ? fileHeaders.join('، ') : 'لا يوجد'})\n`
                    + `تأكد من أن السطر الأول في ملف الأكسل يحتوي على أسماء الحقول الصحيحة.`
            });
        }

        const loaded_students_record = translateHeaders<any>(students_js_obj, STUDENT_HEADER_TRANSLATIONS)

        if (loaded_students_record.length === 0) {
            return res.status(400).json({
                success: false,
                error: "الملف لا يحتوي على بيانات. تأكد من أن الملف يحتوي على صفوف بيانات بعد سطر العناوين."
            });
        }

        await app.sql.begin(async (sql) => {

            for (const student of loaded_students_record) {
                if (!student?.student_name) {
                    continue;
                }

                const name = String(student.student_name).trim();
                if (!name) {
                    continue;
                }

                const student_number = parseStudentNumber(student.student_number);

                await sql`
                    INSERT INTO students (student_name, student_normalized_name, student_number)
                    VALUES (${name}, ${normalize_arabic(name)}, ${student_number})
                    ON CONFLICT (student_normalized_name) 
                    DO UPDATE SET
                        student_name = EXCLUDED.student_name,
                        student_number = EXCLUDED.student_number;
                `;
            }
        });

        res.json({ success: true });

    } catch (error) {
        console.error(error);
        res.status(500).send('Error importing students from Excel file');
    }
});
