import { type JSX, useCallback, useEffect, useState } from "react";
import { CalendarDays, Trash2, UserRoundPlus } from "lucide-react";

import { EditableTable } from "@/components/EditableTable";
import { Modal } from "@/components/Modal";
import { DynamicForm } from "@/components/DynamicForm";
import { AutocompleteText } from "@/components/AutocompleteText";
import { Section, Subsection } from "@/components/Section";
import { DatePicker } from "@/components/DatePciker";
import type { AttendanceDateData, AttendedStudentData } from "@/rpc";
import { formatUtcAsLocal } from "@/utils/datetime";



export interface AttendanceRpcClient {
    fetchAttendanceDates(): Promise<AttendanceDateData[]>;
    fetchAttendedStudents(year: number, month: number, day: number): Promise<AttendedStudentData[]>;
    markStudentAttended(data: { year: number; month: number; day: number; student_id: number }): Promise<void>;
    markGuestAttended(data: { year: number; month: number; day: number; guest_name: string }): Promise<void>;
    removeAttended(attended_id: number): Promise<void>;
    findStudentByName(name: string): Promise<{ id?: number }>;
    autocompleteStudent(name: string): Promise<string[]>;
}



interface AttendanceTabsViewProps {
    rpc: AttendanceRpcClient;
    initialDate?: { year: number; month: number; day: number };
}



function dateToYMD(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function formatDate(year: number, month: number, day: number) {
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function dateKey(year: number, month: number, day: number) {
    return `${year}-${month}-${day}`;
}

interface PickDateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onPick: (year: number, month: number, day: number) => void;
}

function PickDateModal({ isOpen, onClose, onPick }: PickDateModalProps) {
    const handlePickDate = async (data: { date?: string }) => {
        if (!data.date) {
            throw "يجب اختيار التاريخ";
        }

        const [year, month, day] = data.date.split("-").map(Number);
        onPick(year, month, day);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} className="w-full flex flex-col justify-center max-w-lg">
            <h3 className="font-bold text-lg mb-4 text-center">اختيار تاريخ الحضور</h3>

            <DynamicForm
                key={isOpen ? "open" : "closed"}
                template={[{ title: "التاريخ", key: "date", type: "date" }]}
                onSubmit={handlePickDate}
                submitLabel="متابعة"
                customComponents={{
                    date: ({ value, onChange }) => (
                        <DatePicker
                            date={value ? new Date(value) : null}
                            setDate={(date) => {
                                if (date) onChange(dateToYMD(date));
                            }}
                            className="input input-bordered w-full"
                        />
                    ),
                }}
            />

            <button className="btn btn-ghost w-full mt-4" onClick={onClose}>إلغاء</button>
        </Modal>
    );
}



interface MarkAttendedModalProps {
    isOpen: boolean;
    year: number;
    month: number;
    day: number;
    rpc: AttendanceRpcClient;
    onClose: () => void;
    onSuccess: () => void;
}

function MarkAttendedModal({ isOpen, year, month, day, rpc, onClose, onSuccess }: MarkAttendedModalProps) {
    const [studentName, setStudentName] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const handleMarkAttended = async () => {
        const name = studentName.trim();
        if (!name) {
            setErrorMsg("يجب إدخال الاسم");
            return;
        }

        setIsSaving(true);
        setErrorMsg("");
        try {
            let student: { id?: number } | null = null;
            try {
                student = await rpc.findStudentByName(name);
            } catch {
                student = null;
            }

            if (student?.id) {
                await rpc.markStudentAttended({
                    year,
                    month,
                    day,
                    student_id: student.id,
                });
            } else {
                await rpc.markGuestAttended({
                    year,
                    month,
                    day,
                    guest_name: name,
                });
            }

            setStudentName("");
            onSuccess();
            onClose();
        } catch (error) {
            setErrorMsg(`حدث خطأ أثناء تسجيل الحضور: ${error}`);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal isOpen={isOpen} className="w-full flex flex-col justify-center max-w-lg">
            <h3 className="font-bold text-lg mb-4 text-center">تسجيل حضور</h3>

            <AutocompleteText
                fetchSuggestions={(query) => rpc.autocompleteStudent(query)}
                onSelect={setStudentName}
                value={studentName}
                onChange={setStudentName}
                placeholder="الاسم"
            />

            <p className="text-sm text-gray-500 text-center mt-2">
                إذا لم يكن الاسم مسجلاً كطالب، يُسجَّل تلقائياً كضيف.
            </p>

            {errorMsg && <p className="text-error text-center mt-3">{errorMsg}</p>}

            <button className="btn btn-primary w-full mt-4" disabled={isSaving} onClick={handleMarkAttended}>
                {isSaving ? "جاري الحفظ..." : "حفظ"}
            </button>
            <button className="btn btn-ghost w-full mt-2" onClick={onClose}>إلغاء</button>
        </Modal>
    );
}



export function AttendanceTabsView({ rpc, initialDate }: AttendanceTabsViewProps): JSX.Element {
    const [dates, setDates] = useState<AttendanceDateData[]>([]);
    const [activeKey, setActiveKey] = useState<string | null>(null);
    const [studentsByDate, setStudentsByDate] = useState<Record<string, AttendedStudentData[]>>({});
    const [loadingStudents, setLoadingStudents] = useState(false);
    const [isPickDateOpen, setIsPickDateOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const selectDate = useCallback((year: number, month: number, day: number) => {
        setActiveKey(dateKey(year, month, day));
    }, []);

    const fetchDates = useCallback(async () => {
        const rows = await rpc.fetchAttendanceDates();
        setDates(rows);
        return rows;
    }, [rpc]);

    const fetchStudentsForActive = useCallback(async (key: string) => {
        const [year, month, day] = key.split("-").map(Number);
        setLoadingStudents(true);
        try {
            const rows = await rpc.fetchAttendedStudents(year, month, day);
            setStudentsByDate((prev) => ({ ...prev, [key]: rows }));
        } finally {
            setLoadingStudents(false);
        }
    }, [rpc]);

    const refreshActiveTab = useCallback(async () => {
        await fetchDates();
        if (activeKey) {
            await fetchStudentsForActive(activeKey);
        }
    }, [activeKey, fetchDates, fetchStudentsForActive]);

    useEffect(() => {
        fetchDates().then((rows) => {
            if (initialDate) {
                const key = dateKey(initialDate.year, initialDate.month, initialDate.day);
                const exists = rows.some((d) => dateKey(d.year, d.month, d.day) === key);
                if (!exists) {
                    setDates((prev) => [
                        { year: initialDate.year, month: initialDate.month, day: initialDate.day, student_count: 0 },
                        ...prev,
                    ]);
                }
                setActiveKey(key);
                return;
            }

            if (rows.length > 0) {
                const first = rows[0]!;
                setActiveKey(dateKey(first.year, first.month, first.day));
            }
        });
    }, [fetchDates, initialDate]);

    useEffect(() => {
        if (activeKey) {
            fetchStudentsForActive(activeKey);
        }
    }, [activeKey, fetchStudentsForActive]);

    const handlePickDate = (year: number, month: number, day: number) => {
        const key = dateKey(year, month, day);
        const exists = dates.some((d) => dateKey(d.year, d.month, d.day) === key);

        if (!exists) {
            setDates((prev) => [{ year, month, day, student_count: 0 }, ...prev]);
        }

        setActiveKey(key);
    };

    const activeParts = activeKey?.split("-").map(Number);
    const activeYear = activeParts?.[0];
    const activeMonth = activeParts?.[1];
    const activeDay = activeParts?.[2];
    const activeStudents = activeKey ? (studentsByDate[activeKey] ?? []) : [];

    const customRenderers: Record<string, (row: AttendedStudentData) => JSX.Element> = {
        student_name: (row: AttendedStudentData) => (
            <div className="flex items-center gap-2">
                <span>{row.student_name}</span>
                {row.is_guest && (
                    <span className="badge badge-warning badge-sm">ضيف</span>
                )}
            </div>
        ),
        "@attended_at": (row: AttendedStudentData) => (
            <span className="whitespace-nowrap text-sm opacity-80">
                {formatUtcAsLocal(row.attended_at)}
            </span>
        ),
        "@remove": (row: AttendedStudentData) => (
            <button
                className="btn btn-xs btn-ghost text-error"
                onClick={async () => {
                    await rpc.removeAttended(row.id);
                    await refreshActiveTab();
                }}
            >
                <Trash2 size={16} />
            </button>
        ),
    };

    return (
        <Section>
            <Subsection>
                <div className="menu lg:menu-horizontal menu-vertical w-full justify-between">
                    <div className="text-4xl text-center max-sm:py-10 max-md:w-full">إدارة سجل الحضور</div>
                    <ul className="menu bg-base-200 lg:menu-horizontal rounded-box gap-1 menu-vertical max-md:w-full">
                        <li>
                            <button className="btn" onClick={() => setIsPickDateOpen(true)}>
                                <CalendarDays size={18} /> اختيار تاريخ
                            </button>
                        </li>
                        {activeKey && activeYear && activeMonth && activeDay && (
                            <li>
                                <button className="btn" onClick={() => setIsAddModalOpen(true)}>
                                    <UserRoundPlus size={18} /> تسجيل حضور
                                </button>
                            </li>
                        )}
                    </ul>
                </div>
            </Subsection>

            <Subsection>
                {dates.length === 0 ? (
                    <p className="text-center text-gray-500 py-10">لا يوجد سجل حضور بعد. اختر تاريخاً للبدء.</p>
                ) : (
                    <div role="tablist" className="tabs tabs-boxed overflow-x-auto flex-nowrap w-full">
                        {dates.map((d) => {
                            const key = dateKey(d.year, d.month, d.day);
                            return (
                                <button
                                    key={key}
                                    role="tab"
                                    className={`tab whitespace-nowrap ${activeKey === key ? "tab-active" : ""}`}
                                    onClick={() => selectDate(d.year, d.month, d.day)}
                                >
                                    {formatDate(d.year, d.month, d.day)}
                                    <span className="badge badge-sm mr-1">{d.student_count}</span>
                                </button>
                            );
                        })}
                    </div>
                )}
            </Subsection>

            {activeKey && activeYear && activeMonth && activeDay && (
                <Subsection>
                    <h3 className="text-lg mb-4 text-center opacity-80">
                        الطلاب الحاضرون — {formatDate(activeYear, activeMonth, activeDay)}
                    </h3>

                    {loadingStudents ? (
                        <div className="flex justify-center py-10">
                            <span className="loading loading-spinner loading-lg" />
                        </div>
                    ) : (
                        <EditableTable
                            data={activeStudents}
                            headers={{
                                student_name: "الاسم",
                                "@attended_at": "وقت التسجيل",
                                "@remove": "",
                            }}
                            customRenderers={customRenderers}
                            getRowClassName={(row) => row.is_guest ? "bg-warning/15" : ""}
                        />
                    )}
                </Subsection>
            )}

            <PickDateModal
                isOpen={isPickDateOpen}
                onClose={() => setIsPickDateOpen(false)}
                onPick={handlePickDate}
            />

            {activeYear && activeMonth && activeDay && (
                <MarkAttendedModal
                    isOpen={isAddModalOpen}
                    year={activeYear}
                    month={activeMonth}
                    day={activeDay}
                    rpc={rpc}
                    onClose={() => setIsAddModalOpen(false)}
                    onSuccess={refreshActiveTab}
                />
            )}
        </Section>
    );
}
