import { useEffect, useRef, useState } from "react";
import { useLocation, useSearch } from "wouter";



interface QrAttendResult {
    success: boolean;
    already_attended?: boolean;
    student_name?: string;
    student_number?: number;
    date?: string;
    error?: string;
}



export function QrAttendPage() {
    const search = useSearch();
    const [, navigate] = useLocation();
    const [status, setStatus] = useState<"loading" | "success" | "already" | "error">("loading");
    const [message, setMessage] = useState("");
    const [studentName, setStudentName] = useState("");
    const submittedRef = useRef(false);

    useEffect(() => {
        if (submittedRef.current) {
            return;
        }

        const params = new URLSearchParams(search);
        const query = params.toString();

        if (!query) {
            setStatus("error");
            setMessage("رابط الحضور غير صالح");
            return;
        }

        submittedRef.current = true;
        const returnPath = `/a/qr-attend?${query}`;

        fetch(`/api/qr-attend?${query}`, { credentials: "include" })
            .then(async (response) => {
                const result: QrAttendResult = await response.json();

                if (response.status === 401) {
                    navigate(`/login?next=${encodeURIComponent(returnPath)}`);
                    return;
                }

                if (!response.ok || !result.success) {
                    setStatus("error");
                    setMessage(result.error ?? "فشل تسجيل الحضور");
                    return;
                }

                setStudentName(result.student_name ?? "");

                if (result.already_attended) {
                    setStatus("already");
                    setMessage(`تم تسجيل حضور ${result.student_name} مسبقاً اليوم`);
                    return;
                }

                setStatus("success");
                setMessage(`تم تسجيل حضور ${result.student_name} بنجاح`);
            })
            .catch(() => {
                setStatus("error");
                setMessage("تعذر الاتصال بالنظام");
            });
    }, [search, navigate]);

    return (
        <div className="w-full min-h-screen flex justify-center items-center p-6">
            <section className="w-full max-w-md text-center">
                {status === "loading" && (
                    <span className="loading loading-spinner loading-xl" />
                )}

                {status === "success" && (
                    <div className="space-y-4">
                        <div className="text-5xl text-success">✓</div>
                        <h1 className="text-2xl font-bold">تم تسجيل الحضور</h1>
                        <p className="text-lg">{message}</p>
                        {studentName && <p className="text-gray-500">{studentName}</p>}
                    </div>
                )}

                {status === "already" && (
                    <div className="space-y-4">
                        <div className="text-5xl text-warning">!</div>
                        <h1 className="text-2xl font-bold">مسجل مسبقاً</h1>
                        <p className="text-lg">{message}</p>
                    </div>
                )}

                {status === "error" && (
                    <div className="space-y-4">
                        <div className="text-5xl text-error">✕</div>
                        <h1 className="text-2xl font-bold">خطأ</h1>
                        <p className="text-lg text-error">{message}</p>
                    </div>
                )}
            </section>
        </div>
    );
}
