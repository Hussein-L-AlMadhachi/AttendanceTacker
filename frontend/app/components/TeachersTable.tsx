import { type JSX, useState } from "react";

import { EditableTable } from "@/components/EditableTable";
import type { teacherData, TeacherUpdateData } from "@/rpc";



interface TeachersRpc {
    fetchTeachers(): Promise<teacherData[]>;
    updateUser(id: number, data: TeacherUpdateData): Promise<number>;
    deleteUser(id: number): Promise<void>;
    unlockLoginAccount(login_id: number): Promise<number>;
}



function isAccountLocked(row: teacherData) {
    if (row.is_locked === true) {
        return true;
    }

    return (row.failed_login_attempts ?? 0) >= 6;
}



interface TeachersTableProps {
    rpc: TeachersRpc;
    data: teacherData[];
    onRefresh: () => void;
}



export function TeachersTable({ rpc, data, onRefresh }: TeachersTableProps): JSX.Element {
    const [unlockError, setUnlockError] = useState("");

    const handleUnlock = async (row: teacherData) => {
        if (!row.login_id) {
            setUnlockError("تعذر تحديد حساب الدخول لهذا المستخدم.");
            return;
        }

        setUnlockError("");
        try {
            await rpc.unlockLoginAccount(row.login_id);
            onRefresh();
        } catch (error) {
            setUnlockError(`تعذر تفعيل الحساب: ${error}`);
        }
    };

    return (
        <>
            {unlockError && (
                <p className="text-error text-center mb-4">{unlockError}</p>
            )}

            <EditableTable<teacherData>
                data={data || []}
                headers={{ teacher_name: "الاسم", "@status": "الحالة", ":edit:": "" }}
                getRowClassName={(row) => isAccountLocked(row) ? "bg-error/10" : ""}
                customRenderers={{
                    "@status": (row) => isAccountLocked(row) ? (
                        <div className="flex items-center gap-2">
                            <span className="badge badge-error">
                                مقفل ({row.failed_login_attempts ?? 6})
                            </span>
                            <button
                                className="btn btn-xs btn-success"
                                onClick={() => handleUnlock(row)}
                            >
                                تفعيل
                            </button>
                        </div>
                    ) : (
                        <span className="badge badge-success">نشط</span>
                    ),
                }}
                onDelete={(id: number) => {
                    if (!id) {
                        return;
                    }

                    rpc.deleteUser(id).then(() => onRefresh());
                }}
                onSave={(id: number, rowData: teacherData) => {
                    if (!id) {
                        return;
                    }

                    rpc.updateUser(rowData.id ?? id, {
                        name: rowData.teacher_name || "",
                        password: rowData.password,
                    }).then(() => onRefresh());
                }}
                formTemplate={[
                    { title: "الاسم الكامل", key: "teacher_name", type: "text", disabled: true },
                    { title: "كلمة السر", key: "password", type: "text" },
                ]}
            />
        </>
    );
}
